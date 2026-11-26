# MonthlySummary

An A4 summary an app makes from its data for one period, here a month of CYP EAT. The consumer provides the period, the centres or sections covered, three headline numbers, and the tables.

- Page: `cyp-doc`. Order: `DocHeader`, three `StatTile`, then `ProgressTable` and `DataTable` blocks, each under a `heading-3` title, then the foot. No chitenge strip.
- The summary holds figures and their names. Sentences of comment belong in the narrative report.
- Places keep their fixed colour and order, sections their fixed icon, as set in `ColourKey`.
- A table that does not fit continues on a new `cyp-doc` page with the header repeated.
- The same blocks are used when the summary is shown on a screen of the app.
