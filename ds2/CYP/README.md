This system sets the look of everything the Cicetekelo Youth Project (CYP) produces for reporting: the three apps (CYP EDU, CYP FIN, CYP EAT), the narrative report, and the internal templates the apps make. One set of tokens and one stylesheet (`components/bundle.css`) serve all three. The sections Apps, Narrative report and Internal templates give the rules for each use.

## Logos

- The project seal (`cyp-seal.png`) signs covers, report pages and internal templates. Smallest width 48px on screen, 15mm in print.
- Each app has a wordmark (`cyp-edu.svg`, `cyp-fin.svg`, `cyp-eat.svg`) and a home-screen icon. The wordmark names the app in its app bar and on the documents it makes.
- On `blue`, `navy`, a category colour or a photo, a logo sits on a white plate (`.cyp-plate`). The seal has a white ground and no transparent version.
- The chitenge zig-zag of the wordmarks returns as a thin strip at the bottom edge (`.cyp-chitenge`) of the report cover, of chapter openers and of the sign-in screen of an app. It is not used on internal templates, printed forms or other office documents. Its four colours are used nowhere else.
- Do not redraw, recolour, stretch or crop a logo.

## Colour

- Grounds are `surface` (white), `surface-soft` (app page background, zebra rows, boxes) and `surface-band` (the grey band of report pages, bar tracks, table heads).
- Text is `ink`. Secondary text is `ink-muted`. Text on `blue`, `navy` and the three highlight colours is `on-dark`.
- `blue` is the working blue: primary button, the page row under the app bar, links, heading underline, running heads. The app bar itself is `navy`, so its row and the page row read as two rows. `blue-sky` is the blue of the seal and of the letters CYP: use it for icon discs, the diagonal panel and display text of 24px and up. `navy` closes the gradient of the blue ground.
- The blue ground (`.cyp-ground`) is a vertical gradient from `blue` to `navy` with a `blue-sky` diagonal panel on the right. It carries covers and chapter openers. Titles on it are white, the subtitle is `yellow`.
- `yellow` appears on `blue` and `navy` only: subtitle, date disc, the line under the current page in the page row.
- Colour means place. Each place has one colour, fixed for the apps, the narrative report and the templates (table below). Use the place tokens and classes, never the `cat-` colours directly.
- `crimson` and `purple` mean outcome 1 and outcome 2 in the narrative report (`outcome-1`, `outcome-2`). `royal` is held for a third outcome. They are not used in apps.
- Sections have no colour of their own. A section is told by its icon on a `blue` disc and by its name.
- Text and icons on Minsundu yellow and Mary Christine olive are `ink`. On the other place colours they are `on-dark`, at display size only.
- `ok`, `warn` and `danger` with their `-soft` fills show a status in apps and templates. A status always has its word and an icon. `danger` covers errors (a wrong PIN, an empty required field), bad states (not approved, absent, over budget) and destructive buttons. The words and icons of each state are in `StatusTag`.
- No other colours, no tints of these colours, no gradients except the blue ground and the grey band.

## Fixed colours and icons

| Place | Colour | Class | Icon |
| --- | --- | --- | --- |
| Luigi | `place-luigi` (blue) | `cyp-c-luigi` | `door-open` |
| Minsundu | `place-minsundu` (yellow) | `cyp-c-minsundu` | `bed` |
| Nkwazi Centre | `place-nkwazi` (green) | `cyp-c-nkwazi` | `bird` |
| Community school | `place-community-school` (orange) | `cyp-c-community-school` | `pencil-ruler` |
| Holy Family | `place-holy-family` (mauve) | `cyp-c-holy-family` | `map-pin` until one is chosen |
| Mary Christine | `place-mary-christine` (olive) | `cyp-c-mary-christine` | `map-pin` until one is chosen |
| Ukubalula | `place-ukubalula` (ochre) | `cyp-c-ukubalula` | `map-pin` until one is chosen |
| Other, or all places together | `place-other` (grey) | `cyp-c-other` | none |

| Outcome | Colour | Class | Icon |
| --- | --- | --- | --- |
| 1. Rehabilitation and inclusion of vulnerable young people | `outcome-1` (crimson) | `cyp-c-outcome-1` | `users` |
| 2. Social enterprises and livelihoods | `outcome-2` (purple) | `cyp-c-outcome-2` | `sprout` |

| Section | Icon on a `cyp-c-blue` disc | Also covers |
| --- | --- | --- |
| Education office | `graduation-cap` |   |
| Family Section | `home` |   |
| School Section | `school` |   |
| UCC Children Section | `puzzle` |   |
| Youth | `backpack` |   |
| Literacy class | `book-open` |   |
| Counselling | `message-circle-heart` |   |
| Sports | `trophy` | Tennis, Football, Basketball, Golf |
| VET training | `wrench` | the Skills sections |
| Canteen | `utensils` |   |
| Disability programme | `hand-heart` |   |
| Social enterprises | `sprout` | Gigi Bonta, Farms |
| Administration | `briefcase` |   |
| Human Resources | `contact` |   |
| Security guards | `shield` |   |
| Transport | `bus` |   |
| Mechanics workshop | `cog` |   |
| Maintenance | `hammer` |   |

- Places appear in the order of the table in every chart, table and list, also when only some of them are shown.
- A chart that compares sections uses `blue` bars with the names beside them.
- A unit listed under Also covers takes the icon of its section and keeps its own name.
- UCC and Youth are both at Minsundu and take the Minsundu colour. The Literacy class does too.
- A place shows its own icon on a disc in its own colour. A place without one takes `map-pin`. A place icon is never a section icon.
- A new place or section gets its colour or icon in this table first. No app, report or template picks one on its own.
- The `ColourKey` component shows the three lists as a legend.

## Type

- Titles, numbers, labels and buttons are set in Ubuntu (`--font-display`): Bold for titles and figures, Medium for buttons.
- Text is set in Open Sans (`--font-text`). The narrative report uses Light at 15px on a 24px line (`body-report`). Apps and templates use Regular at 16px (`body`). Light is not used in apps.
- Capitals: cover title, opener titles, `heading-1`, and everything in `label-caps`. All other text is sentence case. No title case.
- `heading-1` takes a 3px `blue` underline (`.cyp-h1`). No other heading is underlined.
- Large numbers use `figure`. Columns of numbers use tabular figures and align right.
- Bold inside text marks the phrase a reader scans for. Quoted words are italic semibold in `blue`. No underlined text, no coloured words.

## Shapes and layout

- Blocks are square: result blocks, bars, boxes, tables, photos and cards in reports and templates have `radius-0`.
- Controls in apps (buttons, inputs, tags, cards) have `radius-control` (4px).
- A screen counts as a computer from 900px wide (`screen-computer`). On a computer, forms, lists and text are `content-narrow` (720px) wide at most, tables, registers and dashboards `content-wide` (1,200px).
- Circles are for icon discs and the date disc only.
- One shadow (`shadow-card`) for a card that floats over a photo, and for a sheet that opens over an app screen.
- Hairlines are `line`. Borders of controls and the rule above a running foot are `line-strong`.
- Space comes from the spacing scale: 16px inside cards and phone screens, 24px between blocks, 32px inside report boxes, 64px as the side margin of report pages.
- Photos are full-bleed rectangles with no frame, no rounded corners and no text on them. A hatched slot (`.cyp-photo`) holds the place until the photo is there.

## Icons

- Icons come from Lucide (ISC licence), drawn at 24px with a 1.75 stroke. The Icons group holds the set in `ink`.
- In a page, inline the SVG with class `cyp-icon` so it takes the colour of the text around it. Inside a disc (`.cyp-disc`) it turns white, or `ink` on `cat-yellow` and `cat-olive`.
- An icon stands beside a word. The exceptions are the icon disc, whose word is next to it, and the minus and plus of the stepper.
- No emoji, no filled icons, no second icon set.

## Writing

- Apps use the English spoken in Zambia, with short common words. A screen says what to tap and what happens next. It does not explain the work to the person who does it.
- Button labels start with a verb: Save, Record a visit, Send a request, Export in Excel.
- One name for one thing in the three apps, the report and the templates: Luigi, Minsundu, Nkwazi Centre, Community school. Luigi and Minsundu are written without the word Centre. Where a database stores another spelling (Luigi Centre, Nkwazi), the stored value stays and the app shows the fixed name on screen and in exports.
- Report text starts with the fact or the result. Each point and each figure is written once. Titles state the content: no questions, no slogans.
- Dates read 23/11/2026 in tables, exports and prints. A screen where a person counts or marks on the spot may write the day of the week: Thu 19 Nov. Thousands take a comma: 1,248. Amounts in Kwacha take K before the number: K 4,360.
- Use the hyphen. No long dashes.
- Examples, mockups and screenshots that leave the project show "Sample name" in place of a child's name.

## Legibility

- Text holds 4.5:1 against its ground. Text of 24px and up, bold text of 19px and up, icons and control borders hold 3:1. The usage note of each colour token names the grounds it passes on.
- Anything a person taps is at least 48px high and wide (`touch-min`).
- Keyboard focus is a 3px solid `focus` ring with a 2px offset. On `blue` and `navy` the ring is `yellow`.
- Colour is never the only carrier: a place has its name beside its swatch, a status has its word and icon.

## Files

- Load `tokens.css`, then `components/bundle.css`. Classes start with `cyp-`.
- `tokens.css` is generated from `tokens.json`. It holds the colour, spacing, radius, shadow, size and motion variables, the font families, the `@font-face` rules for the files in `fonts/`, and the type styles in two forms: as classes named after the styles (`heading-2`, `label-caps`, `figure`) and as variables for a font declaration (`font: var(--type-small) var(--font-text)`).
- `bundle.css` takes every font size from the type variables. An app that adds its own styles does the same and writes no font size by hand.
- Movement uses the motion variables (`motion-press`, `motion-state`, `motion-tab`, `motion-sheet`, `motion-page`, `motion-bars`, `motion-stagger`, `ease-enter`, `ease-grow`). The rules are in the Apps section.
- The font files are in `fonts/` (Ubuntu under the Ubuntu Font Licence 1.0, Open Sans under the SIL Open Font Licence 1.1; texts in `licenses/`). Each app ships its own copy of the fonts, the stylesheet and the icons, so that it opens without internet.
