# ProgressTable

The detail of one result: a framed table with one row per place, a bar for progress against target, and the current and target values. The consumer provides the result name, its unit, its icon, and for each row the place, the percentage, the current value and the target.

- The frame and the disc take the colour of the outcome (`cyp-c-outcome-1`, `cyp-c-outcome-2`) in the narrative report, and `cyp-c-blue` in app screens and internal templates.
- Each row takes the class of its place (`cyp-c-luigi`, `cyp-c-minsundu`, `cyp-c-nkwazi` and so on). Rows follow the fixed order of places in `ColourKey`.
- When the rows are sections, every row takes `cyp-c-blue`.
- The bar fill is the row colour, the track is `surface-band`. A bar stops at 100%. The percentage column shows the real value, above 100% too.
- Numbers sit beside the bar in `ink`. No text inside a bar.
- The last row is the total, in bold, with no bar.
- Under 900px, outside report pages and templates, each row puts the name on its own line above the bar and the figures. In app pages on a phone prefer `ProgressRow`.
- Bars grow once when their page comes in.
