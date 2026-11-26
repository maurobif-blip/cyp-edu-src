# CYP EDU: sources

CYP EDU is the records app of the Education Department of the Cicetekelo Youth Project (Ndola, Zambia), built by Claude for Mauro Bifulco. The published app is https://maurobif-blip.github.io/cyp-edu/ (repository `maurobif-blip/cyp-edu`, built files only). This private repository holds what builds it.

The state of the app, the decisions and the history of every version are in the claude.ai project "Evaluation Cicetekelo", document `piattaforma/CYP-EDU_stato-attuale.md`. Read it before changing anything.

## Start of a session

1. `bash /home/claude/cyp-edu-src/setup.sh`: links `/home/claude/alpha`, `demo`, `web`, `server`, `ds2` and `publish_edu.sh` to this repository, creates `/tmp/cyp-shots/` for screenshots.
2. `local/pin.txt` holds the default PIN of the computer file. It is not in the repository and is never written in chat, in the project or in a commit. Without it the computer file and the demo do not build. If it is missing: the Mac of Mauro has a copy in `Documents/Cicetekelo/cyp-edu-local/pin.txt`; stage it to this path without printing it.
3. To publish: attach `maurobif-blip/cyp-edu` with push access and clone it to `/home/claude/cyp-edu`.

## Layout

- `alpha/`: the modules (`app.js`, `luigi.js`, `plan.js`, `staff.js`, `pick.js`, `more.js`, `nkwazi.js`, `school.js`, `docs.js`, `tasks.js`, `groups.js`, `cases.js`, `dsicons.js`, `dsafter.js`, `office.js`, `story.js`, `docx.js`, `counsel.js`, `sync.js`, `web.js`), styles (`app.css`, `ds.rules.css`, generated `ds.css` and `ds.web.css`), `build.py` (computer file), `mkds.py` (design system to `ds.css` and `dsicons.js`), tests `t*.js`, audits.
- `demo/`: `build_demo.py` and `demo_state.json` (invented children, real names of the staff: internal, never published). `gen_demo.py` rebuilds the state from files that are not here.
- `web/`: `build_web.py` builds the web version in `web/cyp-edu/` (no data, no PIN, no staff names: the script checks).
- `server/`: fake database used by the tests that sync two devices.
- `ds2/CYP/`: copy of the CYP design system (artifact https://claude.ai/artifact/SN1a7wqgvwUARiBveDDqah). When the design system changes: refresh this copy, run `python3 mkds.py`, rebuild.

## Build, test, publish

```
cd /home/claude/alpha && python3 build.py && (cd ../demo && python3 build_demo.py) && (cd ../web && python3 build_web.py)
node t98.js            # one test; the regression set is in the status document
git -C /home/claude/cyp-edu-src add -A && git -C /home/claude/cyp-edu-src commit -m "..." && git -C /home/claude/cyp-edu-src push
CLAUDE_SESSION_URL=<this session> CLAUDE_COAUTHOR="<model> <noreply@anthropic.com>" /home/claude/publish_edu.sh "message"
```

- Bump `VERSION` and `BUILD_DATE` in `app.js` for every version.
- `publish_edu.sh` stops if the built versions differ, if the sources are not committed and pushed, or if the last commit of the app was not made from these sources.
- Publish only after Mauro says so.
- Tests `t20`-`t28`, `t59`, `t80` import the real starter pack (`/home/claude/reports/`), which holds data of children and is never put here. Without it they cannot run.

## Rules

- Children's data never goes to GitHub or to any page that leaves the project.
- The staff link and the database key live only on Mauro's Mac (`Documents/Cicetekelo/CYP-EDU-collegamento.txt`): never read, quote or copy them.
- Comments in the app: read from the live database, fix, then mark them done (`Claude · done in <version>`).
