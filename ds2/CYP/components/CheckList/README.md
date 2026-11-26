# CheckList

Several choices at once from a list: the twelve months, a list of sections. The consumer provides the question as the `<legend>` and one checkbox with its label per row.

- Each row is at least 48px high, and the whole row ticks the box.
- A ticked box is filled `blue` with a white check mark.
- `cyp-checklist--two` sets the rows in two columns, for short labels such as months.
- Rows keep a fixed order: the calendar for months, `ColourKey` for sections and places.
- Use `Choice` with checkboxes when there are six short options or fewer and they fit on one or two lines of buttons. Use `CheckList` for longer lists and longer labels.
- A row for all the items (All months) goes first when the list has one.
- To tick children, use `ChildPicker`: it adds filters, a search, Tick all and Untick all to this list.
