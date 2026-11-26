# ProgressRow

One section or one place with its progress, built for the width of a phone: the name with its disc, the percentage, a bar, and the two figures under the bar. The consumer provides the name, the icon, the colour class, the percentage, and the two figures with their words.

- `cyp-prow` with a colour class. A section takes `cyp-c-blue` and its icon from `ColourKey`. A place takes its own class and its own icon, and places follow their fixed order.
- The bar stops at 100%. The percentage shows the real value, above 100% too.
- Under the bar: on the left what is reached, on the right the target, each with its word or unit.
- A row that leads to more detail is itself the tap target (`cyp-prow--link`, on an `<a>` or a `<button>`), with `chevron-right` after the percentage. It turns `surface-soft` while pressed. A row that leads nowhere has no chevron.
- Without a target there is nothing to measure against: no bar and no percentage. The row shows the name and the value in the place of the percentage, and under it the unit with the words no target set (`cyp-prow--count`). Do not draw a bar against the largest value: in this component a bar always means progress to a target.
- Rows stack inside a card with a `heading-3` title. No frame around them. In one card all rows have a target or none has.
- Use it in app pages on a phone. `ProgressTable` is for computers, reports and templates.
- The bar grows once when its page comes in.
