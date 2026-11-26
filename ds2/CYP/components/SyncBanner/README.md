# SyncBanner

A full-width line under the app bar that says whether the work is saved and sent. The consumer provides the state.

- Offline: `cyp-banner--warn`, stays as long as there is no internet. It says the data is safe on the device and will send by itself.
- Sent: `cyp-banner--ok`, shows for a few seconds after saving.
- Failed: `cyp-banner--danger`, stays until the person saves again. It says what to tap.
- Each banner has an icon and a full sentence. No codes, no technical words.
- A banner the person may dismiss ends with one button, Close. Offline and failed banners have no Close.
- The banner never covers a button.
