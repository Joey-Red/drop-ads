# Milestones 164–173 — Collection, compiler, and final emission boundaries

This block continues Drop Ads' fail-closed input hardening without changing its privacy model, permissions, network/cosmetic precedence, list-source defaults, or browser qualification status. Connector-created tests in this block are regression coverage only; they are not represented as executed clean-checkout or browser validation.

## 164 — Descriptor-safe bounded subscription collections

- `normalizeSubscriptions()` snapshots real subscription arrays as dense enumerable data before candidate normalization.
- One generic subscription normalization pass accepts at most 128 raw configured entries, matching persisted/imported configuration ceilings.
- Holes, symbols, accessor indices, and extra array properties fail before candidate work and without getter execution.
- Legacy non-array input still means no configured overrides, so canonical built-ins remain available.

## 165 — Descriptor-safe cache envelopes in subscription consumers

- Cache pruning plus network/cosmetic cache merges now route non-null cache containers through `assertRawListCacheBound()` before source-id reads.
- Accessor, symbol, hidden, invalid-key, custom-prototype, array, and over-256-entry cache containers fail before decode/merge work.
- Null/undefined cache input retains empty-cache behavior.

## 166 — Descriptor-safe supported-rule count inputs

- Remote supported-rule admission validates parsed network/cosmetic result objects as exact plain-data schemas before reading counts.
- `block`, `allow`, `hide`, and cosmetic `allow` collections are dense data arrays bounded by the configured supported-rule limit before length is trusted.
- `unsupportedCount` is accepted only as a non-negative safe integer.
- Getter-bearing/unknown/custom-prototype result containers cannot execute conversion/accessor code during count admission.

## 167 — Exact compile-rule option and exclusion inputs

- `compileRules()` options are an exact plain-data schema containing only optional `excludedInitiatorDomains`.
- Exclusion arrays are dense data arrays capped at 5,000 raw entries before domain normalization.
- Malformed options fail even on allow tiers instead of being silently ignored at the boundary.

## 168 — Descriptor-safe bounded compile-rule candidates

- Each `compileRules()` tier input is snapshotted before normalization/dedupe.
- One tier accepts at most 1,000,000 raw rule candidates; one-over fails as a whole rather than truncating.
- Holes, accessors, symbols, and extra array properties fail before rule normalization.
- Existing domain batching, canonical dedupe, tier capacity checks, IDs, priorities, and precedence are unchanged.

## 169 — Exact non-coercive dynamic-rule budget options

- `compileManagedRules()` accepts only optional `maxDynamicRules` in an exact plain-data options object.
- Finite budgets must be non-negative safe integers; positive `Infinity` remains the reviewed unbounded sentinel.
- Numeric strings, boxed/coercion objects, fractions, NaN, negative values, and unsafe integers fail without conversion hooks.
- `personalPolicyReserveForBudget()` enforces the same direct-call contract; the reserve formula itself is unchanged.

## 170 — Descriptor-safe managed policy state reads

- The managed DNR compiler snapshots only the relevant state fields: cookie mode, disabled/cookie-allow sites, shared block/allow, and personal block/allow.
- Relevant fields must be own enumerable data; unrelated canonical state fields can remain present without being read.
- Disabled/cookie-allow arrays are dense data arrays capped at 5,000.
- `personalAllow` is snapshotted before recovery allow rules are appended, preventing malformed iterator/accessor execution.
- Shared/personal rule arrays continue through the generic one-million candidate compiler boundary.

## 171 — Descriptor-safe bounded country-policy collections

- `collectCountryRules()` snapshots real arrays before parsing/grouping and caps inspection at 10,000 candidates, matching the personal-network collection ceiling.
- Non-array legacy input remains empty.
- Existing canonical ccTLD parsing, deterministic sorting, and All-resources-over-Navigation grouping are unchanged.

## 172 — Exact cosmetic compiler options and stylesheet boundary

- Single-tier and tiered cosmetic compiler option objects are exact descriptor-safe schemas validated before any field read.
- `maxSelectors` must be a non-negative safe integer no greater than 2,048.
- `maxBytes` must be a non-negative safe integer no greater than 256 KiB.
- Defaults remain 2,048 selectors / 256 KiB; zero remains a valid caller-requested lower limit.
- Final stylesheet emission snapshots a dense selector array capped at 2,048, revalidates selector syntax, and rejects UTF-8 output over 256 KiB.
- Non-array/empty stylesheet input retains empty-string behavior.

## 173 — Documentation and exact-head qualification sync

- This document and `ROADMAP.md` record the completed 164–173 hardening block.
- Issue #10 remains the real Chromium + Firefox release gate on the exact implementation head.
- PR #7 remains draft until clean preflight/package verification and real browser observations are recorded for that exact head.
- No test, audit, package, reproducibility, source-qualification, or browser pass is claimed merely because connector-backed code/tests were added.

## Privacy invariants retained

This block adds no telemetry, analytics, browsing/request history, retained match statistics, DOM/page history, user/device identifiers, custom backend, remote executable code, or new extension permission. Local recovery semantics and the existing personal/shared precedence remain unchanged.
