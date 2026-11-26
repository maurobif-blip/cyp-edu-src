# Stepper

A number changed by tapping minus and plus, for counts made on the spot: plates, people, bags. The consumer provides the label, the starting value, and the step.

- The value is set in Ubuntu Bold 40px between two 48px buttons. Plus is the primary button, on the right.
- A count that usually goes above 20 (plates, people) is typed: tapping the value opens the number keyboard, and minus and plus only correct it by one. A small count (bags, crates) is made with minus and plus.
- The two buttons are the one place where a button shows an icon alone. Each has an `aria-label`.
- The value does not go below zero.
