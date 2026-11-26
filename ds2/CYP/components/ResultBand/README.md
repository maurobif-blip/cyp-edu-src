# ResultBand

One top-level result in three parts on a row: a sentence, the result name with its icon disc, and one figure on a colour block. The consumer provides the sentence, the name (two lines at most), the figure, its unit, and the outcome the result belongs to.

- The colour is the colour of the outcome: `cyp-c-outcome-1` (rehabilitation and inclusion) or `cyp-c-outcome-2` (social enterprises and livelihoods). See `ColourKey`.
- The disc holds the icon of the section that produces the result, or the icon of the outcome.
- The figure is set in `figure`, the unit under it in capitals. One figure per block.
- The figure in the block is not repeated in the sentence beside it.
- Bands stack with a hairline between them, grouped by outcome. Do not place two side by side.
- In an app the band takes the colour of the place it is about (`cyp-c-luigi`, `cyp-c-minsundu` and so on, with the icon of the place in the disc) or `cyp-c-blue` for a section, with the icon of the section. The outcome colours (crimson and purple) are for the narrative report only and never appear in an app.
- In an app the first part may hold the value and a small ring (`cyp-ring`) in place of the sentence.
- In an app a band that leads to more detail is itself the tap target (`cyp-result--app cyp-result--link`, on an `<a>` or a `<button>`), with `chevron-right` after the colour block. It turns `surface-soft` while pressed. The narrative report has no link.
- Under 900px the parts stack in this order: name with its disc, colour block, value. The chevron stays at the right of the name.
