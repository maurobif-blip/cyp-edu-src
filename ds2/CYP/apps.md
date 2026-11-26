# Apps

CYP EDU, CYP FIN and CYP EAT share one look. A person who knows one app finds the same bar, the same buttons and the same words in the other two. The wordmark in the app bar tells them apart.

## Screen

- Order from top to bottom: `AppBar`, `SyncBanner` when there is something to say, page title in `heading-2`, content, `TabBar`.
- Page ground `surface-soft`. Content on white cards (`cyp-card`) or white rows (`cyp-row`).
- Side padding 16px on phones. A screen counts as a computer from 900px (`screen-computer`). There, forms, lists and text are 720px wide at most (`cyp-content`), tables, registers and dashboards 1,200px (`cyp-content cyp-content--wide`), centred.
- On a phone the `AppBar` stays at the top (`cyp-appbar--fixed`) and the `TabBar` at the bottom (`cyp-tabbar--fixed`). Both keep clear of the notch and the home indicator.
- A task that needs its own window (a new record, a comment, a PIN) opens in a `Sheet`: full screen on a phone, a card on a computer.
- The sign-in screen shows the wordmark, the fields, one primary button and the thin chitenge strip (24px) at the bottom edge. Names to choose from are grouped by access level: Site admins, Administration, Education Department. The home page of a level that matches a section (Administration) shows the icon of that section.

## Actions

- One primary button per screen. It sits under the content it saves, full width on phones.
- A list of records that each wait for a decision is the exception: each record shows its answers side by side with the same weight, the refusal with a red border, and no primary button. See `Button`.
- Two or three options are shown all at once with `Choice`. A `select` is for four or more.
- Opening a record: the row of the record is the tap target, from edge to edge, with `chevron-right` at the end. Where the row has its own action button (Present, Approve), the title opens the record. No separate Open button. See `ListRow`.
- Saving, changing, marking, approving and deleting go through labelled buttons. A word inside a sentence is never a link.
- A status tag may be the button that changes the state (`cyp-tag--button`). It opens the other states under the row as a `Choice`.
- In a register marked on the spot, each row ends with one large marking button (120 by 64px at least). See `ListRow`.
- Choosing the children of a group session or activity uses `ChildPicker`.
- One section asking another to act on a child is a `Referral`.
- A register marked day by day has a day bar at the top: Before, the day with Today or Not today, After. See `Pager`.
- Bands, progress rows and table rows that lead to more detail open the same way: the whole band or row, with `chevron-right`. See `ResultBand`, `ProgressRow` and `DataTable`.
- The app bar is `navy` and holds the wordmark, the place or page, and the sync state. On a computer the page row under it is `blue`. No other fixed row sits under it. Its only button is Comment, a `message-square` icon at the right of the bar before the sync state, one tap from any page. Comment stays under More too. Change (name or centre) and the other tools that are not a main page go under More in the `TabBar`, in the same place in the three apps.
- A button keeps its place and its label on every screen where it appears.
- Steps follow each other one screen at a time. The person never has to guess the next step.
- Deleting and replacing shared data use the `danger` button, then a confirmation that says what will be lost.

## Sizes

- Text a person must read: 16px, and 13px at the smallest for the detail line of a row.
- Tap targets: 48px at least, with 8px between two of them.
- The one exception is a button or a select inside a table row on a computer used with a mouse: 36px high (`control-compact`).
- Numbers typed or counted on the spot use the `Stepper`. Counts that usually go above 20 are typed with the number keyboard, and minus and plus correct by one.

## Saving and internet

- The app bar always shows the sync state with a word: Saved, Sending, Offline.
- Counts of things waiting show as a badge on the `TabBar` item.
- Without internet the warn banner stays and says the data is on the device and will send by itself.
- Nothing asks the person to export, share or send a file to move data between devices.

## Data on screen

- The home page shows `StatTile` numbers first.
- Lists use `ListRow` on phones and `DataTable` on computers. Rows that need action come first.
- Charts by place use the fixed place colours and order of `ColourKey`, with a legend that names each one. Charts by section use `blue`.
- A section shows its fixed icon wherever it is named in a list, a filter or a form.
- On a phone, values against a target use `ProgressRow`, tiles go one per row, and a ring sits above its legend. A table wider than the screen scrolls inside `cyp-scroll`.
- Every table and report has one button, Export in Excel, that exports what is filtered on screen. An export of the whole database is allowed as a second button whose name says so: Export all data in Excel.

## More

- More is the last item of the `TabBar`, with the `ellipsis` icon.
- It shows who is signed in, then Change (name or centre) or Sign out, then Comment, then the other tools of the app.
- Back returns to the page the person came from, with what was written there.
- After a comment is saved the app returns to that page.

## Motion

- A page comes in when the person changes page: its pieces rise by 12px one after another (`cyp-enter`, `motion-page`, `motion-stagger`).
- In a page with topics, the next topic comes in from the right and the one before from the left (`cyp-enter-next`, `cyp-enter-prev`).
- A `Sheet` rises when it opens (`motion-sheet`).
- Bars grow and rings draw once, when their page comes in (`motion-bars`). The number of a `StatTile` may count up from zero at the same moment.
- A button or a `Choice` option shrinks slightly while it is pressed (`motion-press`). A control changes colour in `motion-state`, the marker of the `TabBar` in `motion-tab`.
- Nothing else moves on a tap inside a page. Choosing a place in a chart dims the others (`cyp-dim`) and moves nothing.
- A page redrawn by a sync does not move, and its numbers do not count again.
- Animations change opacity and position only. The ring of a `DonutChart` is the one exception.
- Under `prefers-reduced-motion` nothing moves.

## Interactive report

A summary page of an app is read one chapter at a time. The component `InteractiveReport` shows the pieces. More rules follow once the reference is chosen.

- Cover on the blue ground, then one chapter on the screen at a time.
- The chapters are a row on `blue` with a `yellow` line under the open one. A computer shows number and name, a phone the number only.
- At the bottom: Back, and the primary button Next: followed by the name of the next chapter.
- A place is a `ResultBand` in the colour of the place. A section is a `ProgressRow` in `blue` with its icon. Crimson and purple do not appear in an app.
- A place opens from its band or its row. A slice of a ring is not a button.
- The next chapter comes in from the right, the one before from the left. Its pieces rise one after another, rings draw, bars grow, numbers count, once.

## Exceptions

- CYP EAT, counting plates: one large button adds a plate at each tap, in place of the `Stepper`. The number can still be typed.
- CYP EAT, sign-in: the names and the centres are large buttons, also when there are more than three, in place of a `select`.
- CYP EAT, choosing the day: a calendar in a grid of seven columns. The chosen day looks like a chosen `Choice` option.
