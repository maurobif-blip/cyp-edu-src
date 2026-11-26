# Narrative report

The narrative report is an A4 portrait document built from pages of 794 by 1123px (210 by 297mm at 96 dpi) and printed to PDF from the browser at 100% with background graphics on.

## Page order

1. `ReportCover`: seal on its plate, title, subtitle, date disc, one photo.
2. Contents: a `ReportPage` with the chapter numbers in `figure` and the chapter names in `heading-3`, followed by the `ColourKey`.
3. For each chapter: a `ChapterOpener`, then `ReportPage` pages. A chapter with sub-sections opens each one with a `SectionOpener`.
4. Annexes: `ReportPage` pages holding `DataTable` blocks.
5. Back page: the blue ground with the seal on its plate and the chitenge strip.

## Colours of a report

- Colours and icons are fixed for the whole project and listed in `ColourKey`. A report does not choose its own.
- A result takes the colour of its outcome: `cyp-c-outcome-1` or `cyp-c-outcome-2`.
- A place takes its own colour in every band, chart, table and opener, in the fixed order: Luigi, Minsundu, Nkwazi Centre, Community school, Holy Family, Mary Christine, Ukubalula.
- A section takes its icon on a `blue` disc.
- The `ColourKey` block goes once after the contents page.

## Text pages

- Margins: 64px left and right, 112px top, 88px bottom. The grey band covers the outer quarter of the page and text may run over it.
- One `heading-1` per page. Sub-headings are `heading-2`, then `heading-3`.
- Body in `body-report`. In print this is 9.5pt on a 15pt line. Captions are 8pt.
- An opening paragraph may run the full width. The rest runs in two columns.
- Text from another source goes in a `FindingsBox`.

## Figures

- A top-level result is shown once as a `ResultBand`, then detailed in a `ProgressTable` framed in the same colour.
- Shares of a total by place use a `DonutChart`. Values against a target use the bars of a `ProgressTable`. Everything else is a `DataTable`.
- Every figure has a caption with a bold lead (Figure 3:) and says what is counted, where and over which period.
- A number shown in a figure is not repeated in the paragraph beside it.

## Photos

- One photo on the cover, one per `SectionOpener`, and photos inside pages at full text width or one column.
- No collage, no rounded corners, no filter, no text on the photo.
- Each photo in a page has a caption that says what it shows, where and when.
