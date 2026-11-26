
/* ---------- guided tour (demo only) ---------- */
const TOUR_PREV = () => addMonths(thisMonth(), -1);
function tq(css, root) { return (root || document).querySelector(css); }
function tcard(text, tags) { const h = $$((tags || 'h1,h2,h3') + '', $('#app')).find(x => x.textContent.trim().startsWith(text)); return h ? (h.closest('.card') || h.closest('section') || h.parentElement) : null; }
const TOUR = [
  { go: () => '#/home', find: () => tq('#guide'), t: 'Start from your centre', x: 'Four boxes: Luigi, Minsundu, Nkwazi, and the sections that work in all centres. Each box lists the pages that centre uses, the daily one first. Everyone can open everything; your own section is marked.' },
  { go: () => '#/home', find: () => tq('.main > section.card'), t: 'One picture of the whole project', x: 'Everyone active in the programme today, counted once, in the section where he or she is now. The colours are the four phases of the project. M and F give boys and girls.' },
  { go: () => '#/home', find: () => tq('.main .grid.g6'), t: 'One box per phase', x: 'Click a box to open the list of those children. Luigi counts the children met at outreach or drop-in in the last 3 months. Reintegrated children stay in the records for the 2-year follow-up.' },
  { go: () => '#/home', find: () => tcard('Family Section'), t: 'Monthly targets', x: 'Each section sets its target for the month: home visits for Family, school visits for School. The bar fills as visits are recorded, so the progress is visible during the month and not only in the report.' },
  { go: () => '#/home', find: () => tcard('Luigi Drop-in'), t: 'Luigi this month', x: 'Children in contact this month, boys and girls, new children and children brought to Minsundu. Counted from the outreach and drop-in sessions recorded by the Luigi team.' },
  { go: () => '#/pending', find: () => tq('#ovgrid'), t: 'To do: your sections', x: 'Each section has its box with a few lines: days without attendance, visits that are late, actions still open, reports to check. Red is late, orange is to do soon, grey shows where the month stands. Staff find the To do of their own section on the Home page. Supervisors (Education admin) have a To do page with all sections. Click a line to open the page with the full list.' },
  { go: () => '#/visits?vt=Family&vtab=need', find: () => tq('#vtabs'), t: 'Visits: four separate tabs', x: 'What was done, who needs a visit, the plan of the month, the actions still open. Recording a visit and planning are two different things: the blue button records, the plan is only in its own tab.' },
  { go: () => '#/visits?vt=Family&vtab=need', find: () => tq('#need'), t: 'Who needs a visit', x: 'Children whose home visit is due, grouped by compound, so that one trip covers several families. Residents every 90 days, non-residents every 30, reintegrated children every 60 for two years. One button puts the child in the plan.' },
  { go: () => '#/attendance?c=Minsundu', find: () => tq('#attcheck'), t: 'Absent three days in a row', x: 'Under the attendance list: children marked absent three days in a row. Nobody has to look for them in the register. The same page warns when attendance was not marked for some days.' },
  { go: () => '#/visits?vt=all&vtab=actions', find: () => tq('#actions'), t: 'Follow-up actions', x: 'An action written during a visit stays here until someone marks it done. The actions from counselling sessions are on the Counselling page.' },
  { go: () => '#/pending', find: () => { const a = tq('.main a[href="#/review"]'); return a ? a.closest('.ovcard') : tq('#ovgrid'); }, t: 'Education office', x: 'Seen by supervisors only. Reports to prepare or check, files with information missing, backup, and the open files of children who seem to have left. This box gives the head of department the whole picture.' },
  { go: () => '#/children', find: () => tq('.main .filters'), t: 'Find any child', x: 'Search by name, nickname, ID or compound. Filter by section, status, residence, sex, who follows the child, or information still missing in the file.' },
  { go: () => '#/children', find: () => tq('[data-act=exportlist]'), t: 'Excel everywhere', x: 'Every list has an Excel button. The file contains exactly what is on the screen, with the filters chosen.' },
  { go: () => '#/child/1169', find: () => tq('.main > :first-child'), t: 'One child, one ID', x: 'The same ID from the first day at Luigi to reintegration, whichever centre the child is in. This boy was brought from Luigi to UCC last week.' },
  { go: () => '#/child/1169', find: () => tcard('History'), t: 'The child\'s story', x: 'Everything that happened, newest first: the Luigi sessions where he was met, the move to UCC, the family tracing visit. Nothing is deleted.' },
  { go: () => '#/child/1169', find: () => tcard('Home visits'), t: 'Next visit', x: 'Last home visit and the next one due, calculated automatically from the date of the visit. Planning is done on the Visits page.' },
  { go: () => '#/child/1169', find: () => tq('.main a.btn.pri'), t: 'Record a visit', x: 'Date, purpose, who was met, what was found and the follow-up action. It takes about a minute and it feeds the Family report, the child\'s history and Pending.' },
  { go: () => '#/visits?vt=all', find: () => tq('#vchoose'), t: 'Visits: section and centre', x: 'Each section that visits plans and records its own: Family, School, Luigi, Counselling. Home visits to Minsundu and Nkwazi children are made by the Family Section. First choose the section that does the visits, then the centre of the children. The line below always says what you are looking at.' },
  { go: () => '#/visits?vt=all&vtab=plan', find: () => tq('#plan'), t: 'The monthly plan of visits', x: 'At the end of the month, each section chooses who to visit next month: from the list of who needs a visit, or by name. The children are grouped by centre. A visit recorded in the month ticks the child off by itself. The plan downloads to Excel.' },
  { go: () => '#/visits?vt=Luigi&vtab=need', find: () => tq('#luigi'), t: 'Luigi: three steps', x: 'For every child met by Luigi: first find out where the family is, then plan a home visit, then the child enters the monthly plan of visits.' },
  { go: () => '#/attendance?c=Minsundu', find: () => tq('.main .grid.g4'), t: 'Daily attendance at Minsundu', x: 'One day at a time. Three registers: UCC, Youth, non-residents. The boxes count present, home, boarding school and not marked yet. Click a box to show only those children.' },
  { go: () => '#/attendance?c=Minsundu', find: () => tq('#attTable'), t: 'One click per child', x: '"Mark everyone not marked as present" does the whole list at once; then change only the exceptions. The whole month downloads as the register.' },
  { go: () => '#/attendance?c=Luigi', find: () => tq('#lsheets'), t: 'Luigi: three sheets for the day', x: 'Drop-in centre, day outreach and night outreach are three separate sheets, because different staff can do them. Each box shows how many children and who did it. Click a box to open that sheet.' },
  { go: () => '#/attendance?c=Luigi', find: () => tq('#lattBody') && tq('#lattBody').closest('.card'), t: 'Luigi: who did it, who was met', x: 'Tick the staff who did this sheet, write the places and the findings of the day, then mark the children. A child can be on more than one sheet on the same day. The month sheets show the same marks as in the Luigi tool, one column per day. A new face is first checked in the box above.' },
  { go: () => '#/counseling', find: () => tq('form[data-form=session]'), t: 'Counselling sessions', x: 'Type, centre, child or number of participants, topic and follow-up action. Notes are visible to all staff, so write only what colleagues need to know.' },
  { go: () => '#/reports?s=Luigi&m=' + TOUR_PREV(), find: () => { const s = $$('.main .seg').find(x => x.textContent.includes('Table 6.0')); return s; }, t: 'One report per section', x: 'Each section keeps its own table and codes: Luigi, Nkwazi, UCC, Youth, Family, School, Counselling, and Table 6.0 for Social Welfare.' },
  { go: () => '#/reports?s=UCC&m=' + TOUR_PREV(), find: () => tq('#rtable'), t: 'The table fills itself', x: 'The monthly table is counted from what was recorded during the month. Click "names" to see who is behind each number. Copy it into the Word report or download it for Excel.' },
  { go: () => '#/reports?s=UCC&m=' + TOUR_PREV(), find: () => tq('.main section.card.soft'), t: 'Sent and checked', x: 'The section sends the report to the Education office. After that the records of the month are closed. The Education office marks it as checked, or sends it back with a note. Reports not yet checked appear on To do.' },
  { go: () => '#/reports?s=History&h=UCC', find: () => tq('.main table') && tq('.main table').closest('.card'), t: 'What the sections reported in 2026', x: 'The figures written in this year\'s section reports, period by period, with notes where the numbers do not add up. These are the real figures, to compare with what the records count.' },
  { go: () => '#/review', find: () => tq('.main > :first-child'), t: 'Close old files', x: 'Close these files in one go if the child really left. A closed file can be reopened. Each closure has a date and a reason, for the report to Social Welfare.' },
  { go: () => '#/help', find: () => tcard('Questions for each section'), t: 'What we need from you', x: 'Does the table match yours? What do you record that you cannot record here? What would you look at first in the morning? What takes longer than on paper? Tell Mauro and Ana, or write it down.' },
];
const TT = { i: null };
function tourStart(i) { TT.i = i || 0; TT.nav = true; tourGo(); }
function tourStop() { TT.i = null; $$('.tour-layer').forEach(x => x.remove()); }
function tourGo() { const h = TOUR[TT.i].go(); if (location.hash !== h) { TT.nav = true; location.hash = h; } else tourDraw(); }
function tourPageSteps() { return TOUR.map((s, i) => ({ s, i })).filter(o => o.s.go() === location.hash); }
function tourDraw() {
  $$('.tour-layer').forEach(x => x.remove());
  if (TT.i == null || !USER) return;
  const step = TOUR[TT.i], here = step.go() === location.hash;
  const docRect = el => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  const add = (cls, html) => { const d = document.createElement('div'); d.className = 'tour-layer ' + cls; d.innerHTML = html || ''; document.body.appendChild(d); return d; };
  for (const { s, i } of tourPageSteps()) {
    const el = s.find(); if (!el) continue; const r = docRect(el);
    const dot = add('tour-dot' + (i === TT.i && here ? ' on' : ''), String(i + 1)); dot.title = s.t;
    dot.style.left = Math.max(4, r.x - 12) + 'px'; dot.style.top = Math.max(4, r.y - 12) + 'px';
    dot.onclick = () => { TT.i = i; tourGo(); };
  }
  if (!here) {
    const bar = add('tour-pop tour-mini', `<b>Guided tour</b> · step ${TT.i + 1} of ${TOUR.length}. Click a numbered dot on this page, or <button class="btn sm" data-tour="back">go back to the tour</button> <button class="btn sm" data-tour="close">close</button>`);
    return;
  }
  const el = step.find();
  if (el) {
    if (TT.nav) { const navH = ($('.nav') || { offsetHeight: 0 }).offsetHeight; const tall = el.offsetHeight > innerHeight * .6; el.scrollIntoView({ block: tall ? 'start' : 'center' }); if (tall) scrollBy(0, -navH - 20); TT.nav = false; }
    const r = docRect(el);
    const hi = add('tour-hi'); Object.assign(hi.style, { left: r.x - 6 + 'px', top: r.y - 6 + 'px', width: r.w + 12 + 'px', height: r.h + 12 + 'px' });
  }
  const pop = add('tour-pop', `<div class="sub">Step ${TT.i + 1} of ${TOUR.length}</div><h3 style="margin:4px 0 6px">${esc(step.t)}</h3><p style="margin:0 0 12px">${esc(step.x)}</p>
    <div style="display:flex;gap:8px;justify-content:space-between;align-items:center"><button class="btn sm" data-tour="close">Close the tour</button><span style="display:flex;gap:6px">${TT.i > 0 ? '<button class="btn sm" data-tour="prev">Back</button>' : ''}${TT.i < TOUR.length - 1 ? '<button class="btn sm pri" data-tour="next">Next</button>' : '<button class="btn sm pri" data-tour="close">Finish</button>'}</span></div>`);
  if (el && innerWidth > 700) {
    const r = el.getBoundingClientRect(), ph = pop.offsetHeight, pw = pop.offsetWidth;
    let top = r.bottom + 14, left = Math.min(Math.max(8, r.left), innerWidth - pw - 16);
    if (top + ph > innerHeight - 8) top = r.top - ph - 14;
    if (top < 60) { top = innerHeight - ph - 16; left = innerWidth - pw - 24; }
    Object.assign(pop.style, { top: top + 'px', left: left + 'px', bottom: 'auto', right: 'auto' });
  }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tour]'); if (!b) return;
  const a = b.dataset.tour; e.preventDefault();
  if (a === 'start') tourStart(0);
  else if (a === 'next') { TT.i++; TT.nav = true; tourGo(); }
  else if (a === 'prev') { TT.i--; TT.nav = true; tourGo(); }
  else if (a === 'back') { TT.nav = true; tourGo(); }
  else if (a === 'close') tourStop();
});
document.addEventListener('keydown', e => {
  if (TT.i == null) return;
  if (e.key === 'Escape') tourStop();
  else if (e.key === 'ArrowRight' && TT.i < TOUR.length - 1 && !/input|select|textarea/i.test(e.target.tagName)) { TT.i++; TT.nav = true; tourGo(); }
  else if (e.key === 'ArrowLeft' && TT.i > 0 && !/input|select|textarea/i.test(e.target.tagName)) { TT.i--; TT.nav = true; tourGo(); }
});
let tourT = null;
window.addEventListener('resize', () => { clearTimeout(tourT); tourT = setTimeout(tourDraw, 120); });
