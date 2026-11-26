# AppScreens

Four phone screens that put the app components together: the sign-in screen, counting plates in CYP EAT, the three flows of CYP FIN, the attendance list of CYP EDU. They show layout only. The consumer provides the real content of each screen.

- Sign-in: the wordmark, the fields, one primary button, and the thin chitenge strip (24px) at the bottom edge. No app bar and no tab bar.
- Where people sign in by choosing their name, the names are grouped by access level, each group under a `label-caps` heading, in this order: Site admins, Administration, Education Department. Then the PIN.
- Every screen after sign-in has the Comment button in the app bar, on phones and on computers.
- Every other screen is built in this order: `AppBar`, `SyncBanner` when there is one, the page title in `heading-2`, the content, the `TabBar`.
- The page ground is `surface-soft`. Content sits on white cards or white rows.
- One primary button per screen, full width, under the content it saves.
- 16px side padding on phones. Nothing a person must read is smaller than 13px, and nothing they must tap is smaller than 48px.
