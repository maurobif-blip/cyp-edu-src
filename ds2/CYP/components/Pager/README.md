# Pager

Moving one step back or forward in time: a month, a week, a day. The consumer provides the name of the current period.

- Two labelled buttons, Before with `chevron-left` and After with `chevron-right`, and the current period between them in `heading-3`.
- The period is written in full: November 2026, Week of 23/11/2026.
- After is disabled when the current period is the last one that has data.
- The pager sits under the page title and above the content it changes.
- The content changes in place. The page does not come in again.

## Day bar of a register

- A register that is marked day by day uses the pager with one day as the period (`cyp-pager--day`).
- The day is written with the day of the week: Tue 24 Nov. Under it a tag says whether the day is today: Today, plain, or Not today, `warn` with the triangle, so a person does not mark the wrong day by mistake.
- After is disabled on today: no day after today can be marked.
- The register opens on today every time the page is opened. There is no third button to go back to today.
