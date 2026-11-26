# DataTable

The table for annexes, for exports and for any list of figures. The consumer provides the column heads, the rows, and for grouped rows the section of each group.

- `cyp-table` on the `<table>`. Column heads in capitals on `surface-band`. Even rows on `surface-soft`.
- Numbers: class `num` on the cell (right aligned, tabular figures), thousands with a comma, no unit in the cell. The unit goes in the column head.
- Columns or rows for places follow the fixed order of `ColourKey`: Luigi, Minsundu, Nkwazi Centre, Community school, Holy Family, Mary Christine, Ukubalula.
- A group of rows for one section opens with a `cyp-table__cat cyp-c-blue` cell (`rowspan`) holding the icon of the section. The section name is in the caption or in the first row.
- Buttons and selects inside a row are 36px high (`control-compact`) on a computer used with a mouse. `bundle.css` applies it by itself from 900px with a fine pointer. On phones, tablets and touch screens they stay 48px, and outside a table row they are always 48px.
- A table whose rows open a record makes the whole row the target (`cyp-tr--link`), with a last narrow column holding `chevron-right` (`cyp-table__go`). The row turns `surface-soft` under the pointer and while pressed. A cell may still hold its own button or select: that control acts, the rest of the row opens.
- A wide table on a computer may use `cyp-table--dense`: smaller cell padding. Keep the name on one line and let longer text, such as a status, wrap. Short columns (Sex, Age) stay narrow, and column heads use the short word (Resident, not Resident or not).
- A month grid (`cyp-grid`) has one cell per day, at least 40 by 40px. The cell holds one letter of state on its tone (`cyp-gcell--ok`, `--warn`, `--danger`).
- A small note in the top right corner of a cell (`cyp-cellnote`) says where else the same day was recorded: a few letters, in `caption` (11px) and `ink-muted`. No smaller size. A legend under the grid gives each letter its words, and each note carries an `aria-label` in words.
- Totals go in `<tfoot>`.
- On a screen narrower than the table, wrap it in `cyp-scroll`: the table scrolls sideways in its box and the page stays still.
- The same table is used in the narrative report, in internal templates and on desktop screens of the apps.
