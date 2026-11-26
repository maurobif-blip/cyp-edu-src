# StatusTag

The state of one record in one to four words. The consumer provides the word, the tone and the icon, taken from the tables below.

- `cyp-tag--ok`: done, in order. `cyp-tag--warn`: waiting, or something to do. `cyp-tag--danger`: refused, absent, failed. `cyp-tag` alone, with no icon: a neutral state.
- The word is always there. Green and red are never the only difference between two states.
- A tag can be the button that changes the state: `<button class="cyp-tag cyp-tag--button">` with the state, then `chevron-down`. Its tap area is 48px high and wide even though the tag is lower. The tap opens the other states right under the row as a `Choice` on two columns. Picking one closes it. No floating menu.
- One word means one state in all three apps. A new state is added to a table here first.

| Request in CYP FIN | Tone | Icon |
| --- | --- | --- |
| Waiting for the review | warn | `search` |
| Waiting | warn | `clock` |
| Approved | ok | `check` |
| Moved to next week | warn | `calendar` |
| To revise | warn | `pencil` |
| Not approved | danger | `x` |
| Paid | ok | `banknote` |
| Cancelled | neutral | none |

| Mark on a request in CYP FIN | Tone | Icon |
| --- | --- | --- |
| Emergency | warn | `triangle-alert` |
| Receipt missing | warn | `receipt` |
| No quotation | warn | `file-text` |

| Attendance in CYP EDU | Tone | Icon |
| --- | --- | --- |
| Present | ok | `check` |
| Absent | danger | `x` |
| Street | danger | `map-pin` |
| Sick | warn | `triangle-alert` |
| Permission, Home, Boarding school, Not marked | neutral | none |

| Step of a day in CYP EAT | Tone | Icon |
| --- | --- | --- |
| Done | ok | `check` |
| To do | neutral | none |
| Not done | danger | `x` |

- Not done covers a step of a past day left empty and a step marked as not done today.
- Emergency also shows as a `CardBand` on the card of the request.
