# Milestones 295–299 — UI collaborator bounds

This block tightens the last browser-owned response data that the popup and Settings surfaces can display or inspect. It does not add telemetry, browsing/request history, statistics, identifiers, a custom backend, permissions, or new blocking behavior.

## Milestone 295 — Bound popup runtime error messages

`core/popup-boundary.js` now caps accepted popup runtime failure text at **1,024 characters**. A non-empty browser-owned error string at or below that ceiling may be displayed; an oversized, empty, or type-confused error falls back to the caller's reviewed failure text instead.

The fallback itself is required to be a non-empty string within the same 1,024-character ceiling when a failure path needs it. Success/failure field exclusivity, exact own-data root validation, null-prototype support, and accessor/custom-prototype rejection remain unchanged.

## Milestone 296 — Bound Settings runtime error messages

All shared Settings response helpers now apply the same **1,024-character** failure-text ceiling:

- generic runtime replies
- simple action replies
- subscription mutation replies
- list-refresh replies
- settings-import replies

Oversized or type-confused browser-owned errors use the reviewed caller fallback. Existing discriminator-driven outcome exclusivity and the action-specific nested schemas, status enums, subscription title/source checks, and import-count bounds are unchanged.

## Milestone 297 — Bounded deep Settings result snapshots

Generic successful Settings runtime results are now recursively detached before UI use. Accepted nested data is limited to JSON-like primitives, ordinary/null-prototype own-data objects, and normal dense arrays. The snapshot is recursively frozen.

The work boundary is explicit:

- **32 fields** maximum per nested object
- **128 entries** maximum per nested array
- **8 levels** maximum nesting depth
- **512 visited values** maximum for the complete result tree

Nested accessors, custom prototypes, symbols, sparse/extra-property arrays, cycles, unsupported values, and non-finite numbers fail closed without executing getters. Root arrays remain outside the reviewed generic result contract.

## Milestone 298 — Validate changed personal-rule result payloads

A personal-rule mutation that reports `changed: true` must now carry a rule accepted by the canonical network-rule validator before Settings accepts the result. That reuses the existing rule invariants, including exact rule keys, reviewed domain/URL/pattern kinds, canonical value limits, and the raw **16-resourceType** ceiling.

The UI still receives only the minimal frozen `{ communitySubmission }` projection. A no-op continues to require `rule: null` plus `communitySubmission: "not-requested"`, and `personalAllow` continues to forbid community outcomes beyond `not-requested`.

## Milestone 299 — Documentation and exact-head gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. The exact branch head is recorded on Issue #10 rather than hardcoded into the PR body so later source commits cannot leave misleading release metadata behind.

## Validation status

Regression files added or changed for Milestones 295–299 are **repository coverage only**. This connector session did not execute `npm ci`, `npm run check`, packaging, release/reproducibility verification, source qualification, or real Chromium/Firefox testing.

PR #7 therefore remains draft and Issue #10 remains the authoritative exact-head cross-browser release gate.
