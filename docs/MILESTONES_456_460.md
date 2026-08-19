# Milestones 456–460 — Remote-stream work and lifecycle bounds

This block hardens downloaded-list streaming without changing Drop Ads' privacy model, filter semantics, permissions, or last-known-good transaction behavior. The repository coverage named below was added/edited through the GitHub connector and is **not represented as executed local, package, or browser validation**.

## M456 — Intrinsic streamed-byte accounting

Streamed body chunks remain restricted to `Uint8Array` views, but byte accounting no longer trusts a potentially shadowed `chunk.byteLength` property. The reader path obtains byte length through the typed-array intrinsic after the existing view admission, so subclass getters and caller-controlled shadow fields cannot alter the **5,000,000-byte** download ceiling.

Focused repository coverage: `tests/list-updates-chunk-byte-length-v456.test.js`.

## M457 — Bound raw response-header values

Captured `Content-Type` / `Content-Length` results are admitted as primitive strings and rejected when the raw value exceeds **8,192 characters** before split/trim/regex parsing. Missing headers remain supported. Existing non-list media rejection and exact safe-integer `Content-Length` semantics remain unchanged.

Focused repository coverage: `tests/list-response-header-bound-v457.test.js`.

## M458 — Bound streamed chunk count

The streaming loop admits at most **65,536 nonterminal byte chunks** per response. One-over fails before byte accounting or UTF-8 decoding and attempts reader cancellation best effort. This closes pathological tiny-chunk read/result/decode work while preserving the independent **5,000,000-byte**, fatal UTF-8, timeout, and parser ceilings.

Focused repository coverage: `tests/list-stream-chunk-count-v458.test.js` plus aligned structural coverage in `tests/list-response-chunk-count-v459.test.js`.

## M459 — Release reader locks on every read exit

Reader admission captures optional receiver-bound `releaseLock` alongside `read` and `cancel`. Once a streamed reader has been admitted, lock release is best effort from read cleanup across success and failure; synthetic readers may omit it. Release failure never replaces the primary read result/error.

Focused repository coverage: `tests/remote-reader-release-lock-v459.test.js`.

## M460 — Documentation and release-gate synchronization

This document, the roadmap, draft PR #7, and Issue #10 are synchronized without converting repository coverage into a qualification claim. Any real Chromium/Firefox observations must still be performed against the exact packaged head after the clean preflight sequence in Issue #10. A source change after those observations invalidates them.

## Invariants preserved

- no telemetry, analytics, browsing/request history, retained matched-element/page content, user/device identifiers, or custom Drop Ads backend;
- no remote executable code;
- no permission expansion;
- no silent policy truncation;
- public-list fetching remains bounded and last-known-good/transaction aware;
- PR #7 remains draft until exact-head Chromium and Firefox qualification is complete.
