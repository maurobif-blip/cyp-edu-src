# IconDisc

A line icon on a round colour fill: `<span class="cyp-disc cyp-c-blue"><svg viewBox="0 0 24 24">...</svg></span>`. The consumer provides the inline SVG of one icon from the Icons group and one colour class.

- `cyp-disc` is 64px (`disc-lg`): result bands and progress tables in reports. `cyp-disc--sm` is 32px (`disc-sm`): list rows in apps.
- The colour class follows `ColourKey`: `cyp-c-blue` for a section or a kind of record, `cyp-c-outcome-1` or `cyp-c-outcome-2` for an outcome, a place class (`cyp-c-luigi`, `cyp-c-minsundu` and so on) with the icon of that place from `ColourKey` (`map-pin` where the place has none).
- The class also sets the icon colour: white, or `ink` on Minsundu and Mary Christine.
- Inline the SVG so the stroke takes the disc's colour. An `<img>` of an icon file stays navy.
- A disc carries one icon and no text. The name of the thing sits beside it.
