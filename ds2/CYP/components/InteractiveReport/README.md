# InteractiveReport

A summary of the data of an app, read one chapter at a time on the screen. The consumer provides the chapters, each with a number and a name, and the content of each chapter.

- Cover: the blue ground (`cyp-ground`) with the title in capitals in white and the period in `yellow`, and one button to start.
- Chapters: a row on `blue` (`cyp-nav cyp-nav--chapters`) with a `yellow` line under the open chapter. On a computer each item shows the number and the name. Under 900px it shows the number only, and the page title carries the name.
- One chapter on the screen at a time. Two buttons at the bottom: Back, and the primary button Next: followed by the name of the next chapter. The last chapter has no Next.
- A place is shown as a `ResultBand` in the colour of the place, with the icon of the place in the disc and the percentage in the block. Places follow their fixed order.
- A section is shown as a `ProgressRow` in `blue` with the icon of the section.
- A ring that splits one place in two groups (girls and boys) is a small ring (`cyp-ring`) in `navy` and `blue-sky`, in that order, with the two words and the two numbers beside it.
- Shares by place use a `DonutChart` with its legend. A slice is not a button: a place opens from its band or its row, which end with `chevron-right`.
- Crimson and purple do not appear. They belong to the outcomes of the narrative report.
- Movement: the next chapter comes in from the right and the one before from the left (`cyp-enter-next`, `cyp-enter-prev`, `motion-page`), its pieces rise one after another (`cyp-enter`), rings draw, bars grow and numbers count, once. Under `prefers-reduced-motion` nothing moves.
