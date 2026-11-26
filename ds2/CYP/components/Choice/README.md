# Choice

One answer out of two or three, with every option on screen. The consumer provides the question as the `<legend>`, and two or three radio inputs with a short label each.

- Use it wherever there are two or three options: priority P1, P2, P3; bank or cash; open or done. One tap answers, and the person sees what the other options were.
- Four options or more, with one answer, go in a `select` inside a `Field`.
- Several answers at once: the same component with checkboxes in place of radio inputs. Up to six short options, on two columns with `cyp-choice--two`. Longer lists go in a `CheckList`.
- An option that cannot be picked is `disabled`: grey fill, no border colour.
- Each option is at least 48px high and the options share the width equally.
- The chosen option is filled `blue` with white text and a check mark. The others have a `line-strong` border.
- The order of the options is the same on every screen. No option is chosen in advance unless the record already has a value.
