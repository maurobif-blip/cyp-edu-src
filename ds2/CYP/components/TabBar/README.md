# TabBar

The main pages of an app at the bottom of a phone screen. The consumer provides two to five pages, each with an icon and a word, and marks the current one with `aria-current="page"`.

- Every item has an icon and a label. No item is an icon alone.
- The current item is `blue` with a `blue` line above it. The others are `ink-muted`.
- Each item is at least 56px high and fills its share of the width.
- The order of the items never changes between screens.
- A count of things waiting for the person goes in a badge on the item: `<span class="cyp-badge">6</span>`, white on `blue`. No badge at zero. Above 99 it reads 99+.
- Tools that are not a main page go under a last item called More, with the `ellipsis` icon: Comment, Change (name or centre), Sign out, Admin, Export. More shows who is signed in.
- Comment is also a button in the `AppBar`, one tap from any page. It stays under More as well.
- On a phone the bar stays at the bottom edge: add `cyp-tabbar--fixed`, which also keeps clear of the home indicator, and `cyp-has-tabbar` on the page so the content ends above it.
