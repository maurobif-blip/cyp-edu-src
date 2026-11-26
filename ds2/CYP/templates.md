# Internal templates

Internal templates are the documents the apps make from their data: summaries by month or term, registers, request forms, lists for a visit. They are A4 portrait pages (`cyp-doc`) that an app fills and prints, with no layout work by a person.

## Page

- Every page opens with the `DocHeader`: seal, project name, document title, and three facts (centre or section, period, the app that made it).
- Every page closes with the foot (`cyp-docfoot`): the app, date and time of making, page number. No chitenge strip on a template.
- Margins 48px. Body text 16px, tables 13px.
- Section titles inside a template are `heading-3`. A template has no `heading-1` and no blue ground.

## Blocks

- Headline numbers: three `StatTile` in a row, at the top.
- Values against a target: `ProgressTable`. Lists and breakdowns: `DataTable`.
- Label and value pairs from one record: `cyp-kv`, two columns, labels in `label-caps`.
- Signatures: `cyp-sign`, with the words and the order of the paper form the template replaces. For a payment request: Requested by, Approved by, Actioned by.
- A template holds figures and their names. Comment and interpretation go in the narrative report.

## Rules

- A template uses the names, place colours, section icons and order fixed in `ColourKey`, the same as the app screens and the narrative report.
- A page stays readable when printed in black and white: every bar has its number, every status its word.
- Printing: A4 portrait with 15mm margins. Only the template goes on paper. The app bar, the tab bar and the buttons stay on the screen. `bundle.css` holds the rules, under the class `cyp-printing`.
- A table that does not fit continues on a new page with the header repeated.
- Empty values keep their line so they can be filled in by hand.
- Excel exports carry the same column names and order as the table on screen, one record per row, a bold first row, no merged cells.
