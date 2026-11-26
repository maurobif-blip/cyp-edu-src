# DonutChart

Shares of one total by place, as a ring with a legend that carries the names and the values. The consumer provides a title and the share of each place. Slices add up to 100.

- Each slice is a `<circle>` with the class of its place, `pathLength="100"`, `stroke-dasharray="<share> <100 minus share>"` and `stroke-dashoffset` equal to minus the sum of the slices before it.
- Slices start at the top and run clockwise in the fixed order of places in `ColourKey`, whatever their size. A rest slice (`cyp-c-other`) comes last.
- The ring is for places only. Shares by section go in a `ProgressTable` or a `DataTable`.
- The legend is required: swatch, name in `label-caps`, value. The ring has no labels on it.
- Give the SVG an `aria-label` that reads the values.
- Under 900px, outside report pages and templates, the ring sits above the legend.
- A slice is not a button. A place opens from its row in the legend or in the list beside the ring. When one place is chosen, the other slices and legend rows take `cyp-dim`.
- The ring draws once when its page comes in.
