# CardBand

A band across the top of a card that marks the whole record, for an Emergency request. The consumer provides the word and its icon.

- `cyp-card cyp-card--band`, with `cyp-card__band` as the first child. The band is `warn-soft` with `warn` text, in `small-strong`, with an icon and one or two words.
- One band per card. The state of the record stays in a `StatusTag` inside the card.
- Use it for a property that changes how the record is handled, such as Emergency. A plain state does not get a band.
