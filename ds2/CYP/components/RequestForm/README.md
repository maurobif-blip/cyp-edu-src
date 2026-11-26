# RequestForm

An A4 form made by an app from one record, here a payment request from CYP FIN. The consumer provides the header values, the label and value pairs, the item rows, and the names of the people who sign.

- Page: `cyp-doc`. Order: `DocHeader`, the facts as label and value (`cyp-kv`), the items (`DataTable`), figures as `StatTile`, the signature row (`cyp-sign`), the foot (`cyp-docfoot`) with the chitenge strip.
- Labels in `label-caps`, `ink-muted`. Values in 16px. An empty value keeps its line so it can be filled in by hand.
- Three signature boxes, with the words and the order of the paper form: Requested by, Approved by, Actioned by.
- The foot says which app made the document, the date and time, and the page number.
- Body text is `body` (16px), tables are 13px. The page prints in black and white without losing information.
