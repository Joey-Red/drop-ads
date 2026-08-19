# Milestones 321–325 — Content lifecycle boundary hardening

This block continues the exact-head content-script hardening after Milestones 316–320. It does not change the privacy model, permissions, network/cosmetic precedence, list behavior, or release readiness. Regression files added here are repository coverage only; they were not executed locally or in Chromium/Firefox during this connector-only work.

## Milestone 321 — Descriptor-safe picker timer options

`createPickerSessionTimer()` no longer destructures a caller-controlled options object. Direct callers may provide only `ttlMs`, `setTimeoutImpl`, `clearTimeoutImpl`, and `onExpire` as enumerable own data fields on an ordinary or null-prototype object. Unknown fields, symbols, custom prototypes, accessors, and prototype/own-key/descriptor trap failures are rejected without executing option getters. Existing positive-integer TTL semantics, collaborator defaults, generation identity, cancel/rearm behavior, and the production two-minute picker lifetime remain unchanged.

Repository coverage: `tests/content-picker-timer-options-v321.test.js`.

## Milestone 322 — Descriptor-safe context-target timer options

`createTargetMemory()` now applies the same direct-option boundary to `ttlMs`, `setTimeoutImpl`, and `clearTimeoutImpl`. Supplied timer collaborators must be functions; caller accessors and hostile descriptor/prototype shapes do not become executable configuration. The production context target still expires after ten seconds, and `remember` / `take` / `clear` generation semantics are unchanged.

Repository coverage: `tests/context-target-timer-options-v322.test.js`.

## Milestone 323 — Bounded picker cosmetic mutation result payloads

The content mutation-response boundary now validates the nested cosmetic rule returned by a successful picker save instead of accepting any non-array object. The nested result remains exact `{changed,rule}`. The returned rule accepts only `selector`, optional `domains`, and optional `excludedDomains`; selector text is bounded by the existing 512-character core ceiling and each optional domain array must be a normal dense own-data array with at most 64 non-empty strings bounded by the canonical hostname length ceiling. Sparse/custom-prototype arrays, accessors, symbols, unknown fields, revoked/hostile Proxies, and oversized values fail closed. The picker still consumes only the success discriminator and does not retain the returned rule.

Repository coverage: `tests/content-picker-mutation-result-v323.test.js`.

## Milestone 324 — Cosmetic policy response relations

The content cosmetic-policy response boundary now rejects contradictory selector-count / stylesheet combinations. Disabled policy still requires zero selectors and an empty stylesheet. Enabled pages may legitimately have no cosmetic rules, but zero selectors must correspond to an empty stylesheet and a positive selector count must correspond to non-empty stylesheet text. Existing exact policy shape, 2,048-selector ceiling, 256 KiB UTF-8 stylesheet ceiling, and fail-closed stale-style removal path remain unchanged.

Repository coverage: `tests/content-cosmetic-policy-relations-v324.test.js`.

## Milestone 325 — Documentation and exact-head release-gate synchronization

This document and `ROADMAP.md` record the completed M321–324 boundaries. Draft PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. The exact implementation head is recorded on Issue #10 after synchronization rather than hardcoded into PR metadata.

## Validation status

No `npm ci`, `npm run check`, package generation, release verification, reproducibility run, source qualification, or real-browser observation is claimed for this connector-only block. GitHub-hosted Actions runner allocation remains externally blocked by the account billing/spending-limit state, which is neither a product failure nor successful qualification.

The privacy invariants remain unchanged: no telemetry, analytics, browsing/request history, retained matched-rule/blocked-request history, DOM/page-content history, identifiers, cookie database access, or custom Drop Ads backend.
