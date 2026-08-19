# Shipped executable-code safety

Drop Ads treats downloaded filter lists and GitHub/community data as **declarative data only**. Remote data must never become executable JavaScript or WebAssembly.

`npm run code-safety-audit` scans shipped JavaScript under `src` and rejects executable-code escape hatches that would undermine that boundary:

- `eval(...)`
- `new Function(...)`
- `importScripts(...)`
- string-code `setTimeout` / `setInterval`
- runtime `WebAssembly.compile*` / `WebAssembly.instantiate*`

The runtime graph audit separately rejects dynamic `import()` and non-local module references. Together these gates support Firefox/Chromium extension remote-code policies and make a future trust-boundary expansion an explicit reviewed change.

The code-safety scanner masks comments and string contents before ordinary executable-token matching so documentation text does not create false positives; string-timer call sites retain their literal delimiter specifically so they can still be detected.

This is a build-time repository audit. It adds no extension permission, request observation, telemetry, or runtime network behavior.
