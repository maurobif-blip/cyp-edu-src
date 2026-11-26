# ReportPage

One A4 page of the narrative report: running head, heading, text, figures, running foot. The consumer provides the report title, the chapter name and number, the page number, and the content.

- `cyp-page` sets the page. Add `cyp-page--band` for the grey band on the outer edge.
- Heading: `heading-1` with `cyp-h1` (capitals, blue underline). One per page.
- Text: wrap in `cyp-prose`. Use `cyp-cols` for two columns. `<b>` for the scanned phrase, `<q>` for quoted words.
- Figure captions: `caption cyp-caption`, with the lead (Figure 1:) in `<b>`.
- The running foot reads chapter number, chapter name, page number. Set it in `label-caps`.
- Print from the browser at 100% with background graphics on. The page is 794 by 1123px, which is A4 at 96 dpi.
