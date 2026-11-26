# AppBar

The bar at the top of every screen of the three apps. The consumer provides the app wordmark, the name of the place or page the person is on, and the sync state.

- Left: the wordmark on its white plate, 28px high. Then where the person is, in Ubuntu Medium 16px. Right: the Comment button, then the sync state as an icon with its word (Saved, Sending, Offline).
- The Comment button is the `message-square` icon alone, 24px, white on `navy`, with a 48 by 48px tap target and `aria-label="Comment"`: `<button class="cyp-appbar__action" aria-label="Comment">`. It opens the comment flow from any page in one tap.
- Height `bar-height` (56px), ground `navy`, text white. The bar is the same in CYP EDU, CYP FIN and CYP EAT, on phones and on computers.
- On a computer, the pages follow in a second row (`cyp-nav`) on `blue`, in capitals, with a `yellow` line under the current page. The two shades keep the two rows apart: `navy` says which app and whether the work is saved, `blue` says where to go.
- The chapter row of an `InteractiveReport` is a `cyp-nav` too, on `blue`, under the `navy` bar.
- On a phone, the pages go in the `TabBar` at the bottom. The app bar holds no menu icon. Its only button is Comment.
- The wordmark, the Comment button and the sync state never shrink. The place or page name shortens first, with an ellipsis. On a 360px phone there is room for only a few letters of the name: the page title under the bar (`heading-2`) carries the full name, so the bar may show the name cut short or not at all.
- While the person is choosing the place to comment, the button is hidden (add `cyp-commenting` on `<body>`). Its space stays, so nothing in the bar moves.
- The button is not printed.
