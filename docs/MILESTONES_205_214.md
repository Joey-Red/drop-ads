# Milestones 205–214

This block continues fail-closed input/lifecycle hardening around background bootstrap, browser-owned Protection actions, policy convergence, tab fanout, and cosmetic policy construction. It does not add telemetry, retained browsing/request history, identifiers, a custom backend, or new permissions.

Repository tests added in this connector-only block are coverage committed to the source tree. They are **not represented as executed validation** and do not replace the exact-head Chromium + Firefox qualification gate in Issue #10.

## 205 — Exact descriptor-safe background bootstrap options

`bootstrapBackground()` now accepts only own enumerable data fields `startCore`, `installMandatoryRecovery`, optional `optionalFeatures`, and optional `logger` on an ordinary/null-prototype object. Accessors, symbols, hidden/unknown fields, arrays, and custom prototypes fail before core startup. Logger validity is checked before startup while mandatory fail-loud semantics and coordinated teardown remain unchanged.

## 206 — Dense descriptor-safe optional feature registry

Optional feature registries now pass through the shared dense-array snapshot boundary before descriptor validation. The existing 32-feature ceiling remains. Sparse arrays, accessor indices, symbols, hidden/extra properties, and caller mutation during later work cannot alter the validated feature sequence.

## 207 — Exact descriptor-safe optional installer options

Direct `installOptionalBackgroundFeatures()` configuration now accepts only optional `logger`, `core`, and `registrations` data fields. Supplied registrations must be a `Map`, supplied logger must provide `warn()`, and malformed options fail before any feature installer runs. Per-feature failure isolation and disposable capture are unchanged.

## 208 — Exact descriptor-safe action-count storage reads

`loadActionCountEnabled()` now validates the `storage.local.get()` result as an exact own-data envelope for `dropAdsActionCountBadgeEnabled`. Malformed result objects fail without getter execution. Missing or non-boolean preference values retain the reviewed `true` recovery default.

## 209 — Descriptor-safe action-count storage change routing

The Protection-actions change listener now recognizes the preference key only through an own enumerable data descriptor on an ordinary/null-prototype changes object. Accessor/inherited/hidden keys, arrays, and custom-prototype envelopes do not schedule a resync. Unrelated keys may coexist with a valid preference change.

## 210 — Exact descriptor-safe policy-convergence options

`installPolicyConvergence()` now validates an exact `api`, `controller`, optional `logger` options envelope before capability checks and listener registration. The logger must provide `error()`. Coalesced recovery, rerun behavior, idempotent registration, event discrimination, and disposal remain unchanged.

## 211 — Descriptor-safe tab fanout candidate arrays

`sendTabMessageBatched()` now snapshots the real tabs array through the dense enumerable-data boundary before message cloning, id extraction, dedupe, or sends. No artificial total-tab cap was added; all valid tabs are still attempted under the existing maximum 32 concurrent sends.

## 212 — Exact descriptor-safe cosmetic policy build input

`buildCosmeticPolicy()` no longer destructures a caller-owned object. It validates an exact own-data root containing only `hostname`, `state`, `session`, and `cache` before hostname normalization or policy work. Missing state still yields disabled cosmetic policy as before.

## 213 — Descriptor-safe cosmetic policy state/session reads

Nested cosmetic policy state/session fields are now read only through own enumerable data descriptors on ordinary/null-prototype objects. `enabled` is strictly boolean when present. State/session disabled-site collections use detached dense snapshots under the existing 5,000-domain recovery ceiling before matching. Subscription and personal cosmetic collections continue through their canonical downstream bounds.

## 214 — Documentation and exact-head gate synchronization

This document and `ROADMAP.md` synchronize the repository through Milestone 214. Issue #10 remains the real exact-head browser gate, and PR #7 must remain draft until clean preflight plus real Chromium and Firefox observations are recorded for the final exact head.
