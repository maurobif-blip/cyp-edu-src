# Button

Anything a person taps to open, save, change or send. The consumer provides a label that starts with a verb, and an optional icon before it.

- `cyp-btn cyp-btn--primary`: the one main action of a screen. One per screen.
- `cyp-btn`: every other action, with a `blue` border on white.
- `cyp-btn cyp-btn--danger`: delete, replace the shared database. Follow it with a confirmation that says what will be lost.
- A record that waits for a decision (approve or not) shows its answers side by side in `cyp-actions`, all with the same weight: `cyp-btn` for each, and `cyp-btn cyp-btn--no` (red border and text) for the refusal. No primary button among them, so the layout does not push one answer. The answer is taken on the tap, with no second step, as long as it can be changed afterwards. The labels are the app's own.
- At least 48px high (`touch-min`). On phones use `cyp-btn--block` for the main action.
- Every button has a text label. No icon-only buttons and no text links for actions: saving, changing, marking, approving and deleting always go through a button.
- Opening a record is the one thing a row does by itself: the whole row, or its title, with `chevron-right` at the end. See `ListRow`. A word inside a sentence is never a link.
- One exception: the Comment button in the `AppBar`. It is the `message-square` icon alone, it always has the same place in the three apps, and it carries `aria-label="Comment"`. The minus and plus of the `Stepper` are the other icon-only buttons.
- A button keeps its place and its label from one screen to the next.
- Printing uses a button labelled Print with the `printer` icon.
- A button shrinks slightly while it is pressed (`motion-press`). It has no other movement and no hover effect.
