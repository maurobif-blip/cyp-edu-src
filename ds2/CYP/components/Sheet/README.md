# Sheet

The window that opens over a screen for one task: a new record, a comment, a PIN. The consumer provides a title, the fields, and the label of the one primary button.

- Structure: `cyp-sheet-layer` (the veil, fixed over the screen) holding `cyp-sheet` with `cyp-sheet__head` (title in `heading-2` and a button Close), `cyp-sheet__body` (the fields, scrolling if needed) and `cyp-sheet__foot` (the primary button).
- On a phone the sheet fills the screen. From 900px (`screen-computer`) it is a card as wide as `content-narrow` with `shadow-card`, centred on the veil. `cyp-sheet--card` gives the card look outside the layer.
- One primary button, at the bottom. Close is a labelled button at the top right and never saves.
- The sheet rises when it opens (`motion-sheet`). It closes without movement.
- Closing brings the person back to the page as it was, with what was written there.
- One sheet at a time. A sheet does not open another sheet.
