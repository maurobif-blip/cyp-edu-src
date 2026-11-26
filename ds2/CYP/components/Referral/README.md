# Referral

One section asks another to act on a child: Sports asks the Family Section, the School Section asks the Family Section. The consumer provides the two sections, the reason, the note, who sent it and when, the state, and the answer once there is one.

- A white card (`cyp-card cyp-referral`). From top to bottom: the route in `label-caps` with the two section icons and `arrow-right` (Sports, then the arrow, then Family Section); the reason in `heading-3` with the state tag beside it; the note in a `Note`, as the sender wrote it, in quotes; who sent it and when, in `small`; the answer.
- States: Waiting (warn, `clock`), Answered (ok, `check`), Closed (neutral). They follow `StatusTag`.
- The answer is a `ListRow` that opens the record behind it (the visit report): the kind of record and its date as the title, the first line of what the colleague wrote as the detail, `chevron-right` at the end. While there is no answer, the card ends with the one action the receiving section can take, as a labelled button (Plan a visit).
- No coloured border and no yellow: the route line and the state say what kind of card it is. `yellow` stays on `blue` and `navy`.
- Referrals waiting for a section come first in its To do.
