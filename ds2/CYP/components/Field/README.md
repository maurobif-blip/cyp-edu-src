# Field

One question with its answer box. The consumer provides the label, the input (`input`, `select` or `textarea` with class `cyp-input`), and an optional help line.

- The label is always visible above the box, in bold. No placeholder text in place of a label.
- The box is at least 48px high with a `line-strong` border. Text inside is 16px so phones do not zoom.
- Help text (`cyp-field__help`) only where the answer is not obvious to someone who knows the work.
- An error (`cyp-field--error`) shows a `danger` border, an icon and a short sentence that says what to do.
- Two or three options use `Choice`. A `select` is for four options or more.
- A wrong entry such as a wrong PIN is an error and shows in `danger`: Wrong PIN. Try again.
- One field per row on a phone. Fields follow the order of the paper register or form they replace.
