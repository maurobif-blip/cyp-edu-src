# ListRow

One record in a list: a child, a visit, a request, a delivery. The consumer provides a title, one line of detail, and either nothing, a status tag, or one action button at the end.

- At least 64px high. Title in bold 16px, detail in 13px `ink-muted`.
- The small disc at the start shows the kind of record. It is `blue` in every list.
- Lists of children may start with the photo of the child, or the initials, in a 48px circle (`cyp-avatar`: `line-strong` border, initials in `blue` on `surface`), right before the name. Examples and screenshots that leave the project show the initials SN and Sample name, never a real photo.

## Opening a record

- A row that opens a record is itself the button: the whole row is the tap target, from edge to edge (`<a class="cyp-row cyp-row--link">` or `<button>`). It ends with `chevron-right` in `ink-muted`, which says that the row leads somewhere. It turns `surface-soft` while pressed. No separate Open button.
- A row that also carries an action of its own (marking Present, approving) keeps that action as a labelled button at the end. The row is then not a tap target: the title opens the record, as a button (`cyp-row__open`) that holds the title and a small `chevron-right`, at least 48px high. Keep at least 8px between the title button and the action button.
- A status tag in a row is part of the row and opens nothing by itself, unless it is a `cyp-tag--button` that changes the state.

## In a register

- In a register, where one person marks many rows quickly, the row is 72px high (`cyp-row--mark`) and ends with one marking button (`cyp-btn--mark`) as high as the row and at least 120px wide. It carries the word of the state it sets. The other states open from the tag under the name.
- A row that needs both a tag and a button puts the tag under the title, in `cyp-row__tags`.
- Rows stand in a `cyp-rows` box: one border around the list, no line under the last row.
- Dates read day, month, year: 14/08/2026.
- Rows that need action come first, then the rest in alphabetical order.
