# Milestones 270–274 — Cache decoder and freshness boundaries

This block closes additional direct cache-codec work surfaces without changing the cache format, policy limits, privacy model, permissions, or release gate.

## Milestone 270 — Combined direct rule-pack decode work bound

`decodeRulePack()` now measures the detached compact `d` / `u` / `p` / `r` buckets as one raw work unit before tuple or rule iteration. The combined direct-decoder ceiling is the existing **300,000 raw policy items**: exact-bound input remains admissible, while one-over combinations fail closed rather than multiplying work across independently bounded buckets.

Repository coverage: `tests/cache-rule-pack-combined-boundary.test.js`.

## Milestone 271 — Detached compact network packs at cache admission

v2–v5 cache-entry admission now retains the validated detached snapshots of present `b` and `a` rule packs. Later item counting and decode work therefore operates on the admitted plain-data snapshot instead of revisiting caller-controlled pack descriptors. Accessor packs remain rejected without getter execution, and null/absent packs retain their empty-pack behavior.

Repository coverage: `tests/cache-pack-detachment-boundary.test.js`.

## Milestone 272 — Bounded canonical direct list-cache normalization

`normalizeListCache()` now begins with the same detached raw cache-root boundary used by persistence. Direct normalization therefore inherits the reviewed **256-entry** ceiling and canonical subscription-id key syntax/length boundary (maximum **96 characters**) before any entry compaction. Invalid, accessor-backed, non-canonical, or over-limit roots fail closed as an empty normalized cache; valid ordinary and null-prototype roots retain normal compaction behavior.

Repository coverage: `tests/cache-normalize-root-boundary.test.js`.

## Milestone 273 — Integrity-gated cache freshness metadata

`cacheNextRefreshAt()` no longer trusts a future timestamp based only on a v5 shape plus plausible source key. Source-bound v5 freshness is returned only after the entry fully decodes under current pack schemas, raw-work ceiling, semantic policy normalization, recorded policy-count integrity, and source-identity validation. Tampered entries therefore cannot suppress a due refresh. Legacy and unbound behavior remains intentionally stale/unknown.

Repository coverage: `tests/cache-freshness-integrity-boundary.test.js`.

## Milestone 274 — Documentation and release-gate synchronization

This document, `ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through Milestone 274. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate, and PR #7 remains draft.

The regression files added in Milestones 270–273 are **connector-created repository coverage only**. No claim is made here that `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, or real Chromium/Firefox qualification was executed or passed on this head.

## Invariants retained

- Firefox and Chromium remain on the shared reviewed Manifest V3 source line.
- No telemetry, analytics, browsing/request history, retained blocked-request or matched-rule history, page/DOM history, identifiers, or custom tracking backend.
- No cache format/version change.
- Existing **300,000 raw policy items per cache entry**, **256 cache entries**, **8,000,000 persisted JSON bytes**, source URL limits, and refresh-deferral policy remain unchanged.
- No new permissions or remote executable-code path.
- No qualification checkbox is satisfied by repository coverage alone.
