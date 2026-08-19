# Milestones 215–224

This block continues fail-closed handling at direct runtime and browser-event boundaries without changing Drop Ads' privacy model, permissions, blocking precedence, remote-list policy, or user-facing protection semantics.

## Completed work

- **215 — Exact descriptor-safe background runtime options:** `createBackgroundRuntime()` now accepts only the reviewed `api`, `fetchImpl`, `now`, and `logger` fields on an ordinary/null-prototype enumerable-data object. Defaults remain `fetch`, `Date.now`, and `console`; malformed options fail before API inspection or runtime work.
- **216 — Descriptor-safe country-rule label inputs:** parsed-looking country label objects no longer get property-dereferenced optimistically. `tld` and `mode` must be own enumerable data fields and are revalidated through the canonical country normalizers; raw network rules still use `parseCountryRule()`.
- **217 — Trap-safe context-feedback event field reads:** context-click, tab, storage-change, and cleanup-response field probes contain Proxy descriptor/prototype traps and accept only own enumerable data on ordinary/null-prototype containers.
- **218 — Trap-safe refresh-watchdog alarm routing:** watchdog alarm names use the same trap-safe own-data boundary before invoking the existing non-forced refresh path.
- **219 — Trap-safe policy-convergence event discrimination:** runtime message types, context-menu ids, and scheduled-refresh alarm names cannot throw through hostile descriptor/prototype traps or custom prototypes before convergence routing.
- **220 — Trap-safe import-guard message envelopes:** import message `type` and `backupText` reads now contain descriptor/prototype traps and require ordinary/null-prototype own-data fields; listener identity and removal-race behavior remain unchanged.
- **221 — Trap-safe tab fanout entry identities:** after the tab array's existing dense snapshot, each tab id is admitted only from an ordinary/null-prototype own enumerable data field. Malformed entries are skipped without preventing later valid tabs from being attempted.
- **222 — Exact cosmetic runtime message envelopes:** standalone cosmetic runtime dispatch now requires exact per-action envelopes: `{type}`, `{type, field, rule}`, or `{type, field, key}`. Unknown, hidden, symbolic, accessor, and custom-prototype fields fail closed before cosmetic work.
- **223 — Exact non-coercive runtime initialization options:** direct `initializeRuntime()` accepts only optional boolean `repairState`; malformed or getter-bearing options fail before state repair, context-menu writes, alarm scheduling, storage reads, list refresh, or DNR work.
- **224 — Documentation and release-gate synchronization:** this document and `ROADMAP.md` bind the completed hardening block to the exact branch head that still requires clean preflight and real Chromium/Firefox qualification.

## Validation status

Regression files were added alongside the implementation changes, but they are **repository coverage only** in this connector-only development block. No claim is made here that `npm ci`, `npm run check`, individual Node tests, packaging, release verification, reproducibility verification, source qualification, qualification-record generation, or real Chromium/Firefox qualification was executed.

GitHub-hosted Actions also remain unavailable as qualification evidence while runner allocation is blocked by the account Actions billing/spending-limit state. That external condition is neither a product failure nor a successful validation result.

Issue #10 therefore remains the release gate, and PR #7 must remain draft until the clean exact-head preflight and current-head Chromium + Firefox observations are recorded.

## Privacy invariants retained

This block introduces no telemetry, analytics, browsing/request history, retained blocking statistics, page/DOM history, user/device identifiers, cookie-jar enumeration, custom Drop Ads backend, remote executable code, or new permissions. Community preparation remains optional and serverless, and normal blocking remains browser-local.
