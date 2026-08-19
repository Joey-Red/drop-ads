# Milestones 992–1001 — Cookie-banner action-semantics safety

This sequence hardens automatic cookie-banner rejection against controls whose semantics indicate disclosure, form mutation, alternate roles, busy state, controlled regions, or declarative command behavior. It preserves Drop Ads' zero-telemetry boundary and does not claim browser qualification.

## M992 — Disclosure-state refusal

Added `cookie-banner-action-semantics-safety.js` and loaded it identically in Firefox and Chromium before executor capture. Any candidate carrying `aria-expanded` fails closed.

## M993 — Form-reset refusal

Native button/input controls with `type=reset` fail closed so a reject-looking action cannot reset unrelated form state.

## M994 — Native role agreement

Native button/input controls may have no role or exact `role=button`. Other role overrides fail closed instead of inheriting native-button eligibility.

## M995 — Busy context refusal

`aria-busy` is inspected on the candidate and through at most 16 composed ancestors, crossing open shadow hosts. Missing or exact `false` is safe; any other present value fails closed.

## M996 — Controlled-region refusal

Candidates carrying `aria-controls` fail closed because they advertise a controlled-region interaction rather than an unambiguous one-shot rejection action.

## M997 — Declarative command refusal

Candidates carrying `command`, `commandfor`, `invokeaction`, or `invoketarget` fail closed.

## M998 — Canonical audit extension

`tools/cookie-banner-hardening-audit.mjs` now reads the action-semantics layer, enforces the M992–M997 invariants, requires the new regressions, verifies Firefox/Chromium script-order parity, and preserves the existing `npm run check` gate and older compatibility markers.

## M999 — Loopback qualification fixtures

The existing `127.0.0.1` action-source qualification server now includes isolated routes for disclosure state, reset behavior, native role override, busy context, controlled regions, and declarative command targeting. Unsafe routes expose visible FAIL text only if activated; the safe control remains the positive reject-mode control. The fixture sends no external requests and retains no observations.

## M1000 — Exact-head qualification guide

`docs/COOKIE_BANNER_ACTION_SOURCE_QUALIFICATION.md` now covers action semantics through M999, including reject/off comparisons, reload stability, bounded busy ancestry, exact-head invalidation, and the no-retention boundary.

## M1001 — Canonical synchronization

This document, ROADMAP, and Issue #10 synchronize the exact-head Chromium/Firefox qualification delta and advance canonical numbering to M1002.

## Privacy and qualification boundary

M992–M1001 add no analytics, telemetry, page/action history, click outcomes, busy-state history, counts, timestamps, identifiers, language profiles, DOM snapshots, or owned Drop Ads backend behavior. Repository tests, audits, fixtures, and documentation are supporting preflight evidence only. Issue #10 remains the authoritative real-browser release gate, and any source/package identity change invalidates prior exact-head observations.
