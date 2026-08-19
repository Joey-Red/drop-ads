# Milestones 699–708 — Cache and subscription policy hardening

This block hardens the persisted subscription/cache boundary and the shared policy snapshots produced from it. The changes are repository preflight/runtime hardening only; they do not constitute Firefox or Chromium qualification.

## M699 — Immutable normalized subscriptions

`normalizeSubscription` now returns a detached frozen canonical subscription snapshot. `normalizeSubscriptions` returns a frozen collection of frozen built-in/external entries while preserving built-in ordering, persisted enablement overrides, and source/id de-duplication.

## M700 — Bounded cache merge candidate traversal

Decoded network and cosmetic policy arrays are captured through `snapshotDenseDataArray` under `MAX_RAW_CACHE_POLICY_ITEMS` before merge traversal. Hostile iterator behavior cannot expand merge work or execute through ordinary iteration, and invalid collections fail closed.

## M701 — Immutable merged shared policy

Shared network and cosmetic cache merges now return frozen result objects and frozen policy arrays. Network rules are detached frozen snapshots, including frozen `resourceTypes` arrays; normalized cosmetic rules remain immutable.

## M702 — Canonical internal subscription source keys

Already-normalized subscriptions use a direct canonical source-key helper internally for duplicate-source and cache-identity checks. The public `subscriptionSourceKey` boundary still performs full caller-input normalization and validation.

## M703 — Locale-independent cache ordering

Cache network and cosmetic canonical ordering now uses the shared fixed code-unit comparator instead of `String.prototype.localeCompare`, keeping cache policy output deterministic across locale/environment differences.

## M704 — Immutable canonical cache policy arrays

Normalized and decoded cache network/cosmetic policy arrays are frozen. Network rule/resource-type snapshots are detached and frozen, and invalid/empty decode paths return an immutable empty policy array.

## M705 — Immutable decoded cache entries

Successful `decodeCacheEntry` results are frozen top-level snapshots across v2/v3/v4/v5 and legacy formats. Source-bound v5 identity is incorporated before freezing rather than mutating decoded state afterward.

## M706 — Hostile cache boundary regressions

Focused regressions cover entry-accessor non-invocation, nested hostile rule rejection with valid-neighbor survival, revoked-proxy fail-closed behavior, and immutable decoded results.

## M707 — Executable cache/subscription hardening gate

Added `tools/cache-subscription-hardening-audit.mjs` and wired `cache-subscription-hardening-audit` into `npm run check`. The audit enforces the M699–M706 immutable/bounded/deterministic boundaries and required regressions while rejecting locale-sensitive cache ordering.

## M708 — Current-state synchronization

Roadmap, qualification guidance, current-state audits, and Issue #10 are synchronized to describe M699–M708 as repository preflight/runtime hardening. Issue #10 remains the authoritative exact-head real-browser qualification gate.

## Execution evidence boundary

These source, tests, audits, and documentation changes were created through the GitHub connector in this continuation. They were not executed locally and were not exercised in real Chromium or Firefox here. No browser qualification or release qualification is claimed.
