/* ---------- choosing children: one way everywhere (beta 1.5, comment of Mauro of 24/11 on the group session) ----------
   Filters from the database (register, sex) and a search by name, then ticks. The ticked children stay on top whatever the filter.
   Used by the group counselling session and by Group activities. */
const PICK_REG = [['', 'All children'], ['Luigi', 'Luigi'], ['Minsundu', 'Minsundu, UCC and Youth'], ['UCC', 'Minsundu · UCC'], ['Youth', 'Minsundu · Youth'], ['Nkwazi', 'Nkwazi Centre'], ['School', 'Community school'], ['Literacy', 'Literacy class']];
const PICK_MAX = 150;
const PICK_ON = {};
function pickF(key) { UI.pickf = UI.pickf || {}; return UI.pickf[key] = UI.pickf[key] || { reg: null, sex: '', q: '' }; }
function pickReset(key) { if (UI.pickf) delete UI.pickf[key]; }
function pickReg(c, reg) {
  if (!reg) return true;
  if (reg === 'Luigi' || reg === 'Nkwazi' || reg === 'Minsundu') return centreOf(c) === reg;
  if (reg === 'UCC' || reg === 'Youth') return c.section === reg;
  if (reg === 'School') return dayType(c) === 'Nkwazi community school';
  if (reg === 'Literacy') return dayType(c) === LITERACY;
  return true;
}
/* o: { sel: Set of ids, def: register shown first, here: children present that day (optional), hereLabel, label, empty } */
function pickHtml(key, o) {
  const F = pickF(key), sel = o.sel;
  if (F.reg == null) F.reg = o.here && o.here.length ? 'here' : (o.def || '');
  if (F.reg === 'here' && !o.here) F.reg = o.def || '';
  const regs = (o.here ? [['here', o.hereLabel || 'Present that day']] : []).concat(PICK_REG), term = F.q.trim().toLowerCase();
  let L = F.reg === 'here' ? o.here.slice() : S.children.filter(c => c.status !== 'Closed' && pickReg(c, F.reg));
  if (F.sex) L = L.filter(c => c.sex === F.sex);
  /* a name typed is searched among all the children, whatever the register chosen */
  if (term.length >= 2) L = S.children.filter(c => c.status !== 'Closed').filter(c => (!F.sex || c.sex === F.sex) && (fullName(c) + ' ' + (c.nickname || '') + ' ' + c.id).toLowerCase().includes(term));
  const byName = (x, y) => fullName(x).localeCompare(fullName(y));
  const ticked = Array.from(sel).map(id => child(id)).filter(Boolean).sort(byName), rest = L.filter(c => !sel.has(String(c.id))).sort(byName), shown = rest.slice(0, PICK_MAX);
  const row = c => `<label><input type="checkbox" data-pick="${key}" data-pkid="${esc(c.id)}"${sel.has(String(c.id)) ? ' checked' : ''}>${dsAvatar(c)}<span>${esc(fullName(c))} <span class="sub">${esc(SECTIONS[c.section] ? SECTIONS[c.section].label : c.section || '')}${curAge(c) !== '' ? ' · ' + esc(curAge(c)) : ''}</span></span></label>`;
  const rad = (v, l) => `<label><input type="radio" name="pk-sex-${key}" value="${v}" data-pick="${key}" data-pf="sex"${F.sex === v ? ' checked' : ''}><span>${l}</span></label>`;
  /* ChildPicker of the design system (24/11): register, girls or boys, name, the bar with the count, then the list with the ticked children on top */
  return `<div class="cyp-picker"><p class="pickhead">${esc(o.label || 'Who took part')}</p>
    <div class="cyp-field"><label for="pkreg-${key}">Register</label><select class="cyp-input" id="pkreg-${key}" data-pick="${key}" data-pf="reg">${regs.map(([v, l]) => `<option value="${v}"${F.reg === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
    <fieldset class="cyp-choice"><legend>Show</legend><div class="cyp-choice__row">${rad('', 'All')}${rad('F', 'Girls')}${rad('M', 'Boys')}</div></fieldset>
    <div class="cyp-field"><label for="pickq-${key}">Name</label><input class="cyp-input" type="search" autocomplete="off" data-pick="${key}" data-pf="q" id="pickq-${key}" value="${esc(F.q)}"></div>
    <div class="cyp-picker__bar"><span>${sel.size} ticked</span>${shown.length ? `<button type="button" class="cyp-btn" data-pick="${key}" data-pact="all">Tick all ${shown.length}</button>` : ''}${sel.size ? `<button type="button" class="cyp-btn" data-pick="${key}" data-pact="none">Untick all</button>` : ''}</div>
    ${ticked.length || shown.length ? `<fieldset class="cyp-checklist cyp-picker__list"><legend class="cyp-sr">Children</legend><div class="cyp-checklist__rows">${ticked.concat(shown).map(row).join('')}</div></fieldset>` : ''}
    ${rest.length > PICK_MAX ? `<p class="sub" style="margin:0">${rest.length} not ticked: the first ${PICK_MAX} are shown. Type a name to find the others.</p>` : !rest.length && !ticked.length ? `<p class="sub" style="margin:0">${esc(o.empty || 'No child matches. Change the register or type a name.')}</p>` : ''}</div>`;
}
/* PICK_ON[key] = { sel: () => Set, draw: keepFocus => redraw } */
function pickDraw(key, focus) { const P = PICK_ON[key]; if (!P) return; P.draw(); if (focus) { const i = document.getElementById('pickq-' + key); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } } }
document.addEventListener('change', e => {
  const el = e.target, key = el.dataset ? el.dataset.pick : null; if (!key || !PICK_ON[key]) return;
  if (el.dataset.pkid != null) { const s = PICK_ON[key].sel(); if (el.checked) s.add(String(el.dataset.pkid)); else s.delete(String(el.dataset.pkid)); return pickDraw(key); }
  if (el.dataset.pf === 'reg' || el.dataset.pf === 'sex') { pickF(key)[el.dataset.pf] = el.value; pickDraw(key); }
});
document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.pick && el.dataset.pf === 'q' && PICK_ON[el.dataset.pick]) { pickF(el.dataset.pick).q = el.value; pickDraw(el.dataset.pick, true); } });
document.addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('button[data-pact]') : null; if (!b || !PICK_ON[b.dataset.pick]) return;
  e.preventDefault(); const key = b.dataset.pick, s = PICK_ON[key].sel();
  if (b.dataset.pact === 'none') s.clear();
  else for (const i of b.closest('.cyp-picker').querySelectorAll('input[data-pkid]')) s.add(String(i.dataset.pkid));
  pickDraw(key);
});
