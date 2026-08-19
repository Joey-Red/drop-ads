# Milestones 255–264 — Descriptor boundary completion

This block continues the browser-local privacy/security hardening line without changing Drop Ads product scope, permissions, retained data, remote-code policy, or release status.

## 255 — Descriptor-safe remote list structure options

`assertRemoteListTextStructure()` now consumes `maxLines` and `maxLineChars` through the shared plain-data field boundary after exact option validation. Omitted values retain the reviewed **300,000-line** and **16,384-character-line** ceilings; lower test limits remain supported. Accessors, descriptor changes, and Proxy normal-get traps are not treated as configuration data.

## 256 — Detached remote supported-rule count inputs

Network/cosmetic parser result fields are detached before raw supported-rule accounting. `block`, `allow`, `hide`, cosmetic `allow`, and optional `unsupportedCount` are no longer re-read through caller-controlled properties after exact schema admission. Dense-array work remains bounded by the existing **300,000 supported-rule** ceiling.

## 257 — Detached cosmetic rule normalization fields

Canonical cosmetic normalization now detaches `selector`, optional `domains`, and optional `excludedDomains` before selector/domain processing. The existing **64-domain-per-array** limit, declarative-only selector restrictions, canonical key semantics, and persisted/shared invalid-rule fail-closed behavior remain unchanged.

## 258 — Detached single-tier cosmetic compile options

`compileCosmeticSelectors()` snapshots `hostname`, `hide`, `allow`, `maxSelectors`, and `maxBytes` into stable own-data values before compilation. The reviewed output ceilings remain **2,048 selectors** and **256 KiB**, and allow-over-hide behavior is unchanged.

## 259 — Detached tiered cosmetic compile options

`compileTieredCosmeticSelectors()` now applies the same exact-data snapshot boundary to personal/shared rule collections and compile limits. Precedence remains **personal allow > personal hide > shared allow > shared hide** with deterministic output ordering and the same selector/byte ceilings.

## 260 — Detached native list metadata fields

Packaged native metadata is detached before validating schema version, id, title, and format. Required metadata remains schema **1**, canonical id up to **96** characters, nonblank title up to **120** characters, and format `drop-ads-v1`.

## 261 — Shared import-guard field and cache snapshots

Import preflight now uses `readPlainDataField()` for state subscription, message, and preflight-option reads, and `snapshotRawListCache()` before current-cache provenance lookup. The existing **128-subscription** state bound and **16 uncached enabled remote activations per import** remain unchanged. Invalid current cache/state cannot manufacture reusable provenance.

## 262 — Forward detached validated runtime messages

The background message guard now forwards the detached validated message snapshot rather than the original caller-controlled message object. Nested network-rule, cosmetic-rule, and subscription records are also replaced with detached validated snapshots before listener invocation. The public `validateBackgroundRuntimeMessage()` return shape remains `{ handled, type }`, and group routing/error/listener lifecycle behavior is unchanged.

This closes the prior gap where validation itself was descriptor-safe but a downstream listener could still receive and re-read the original object after validation.

## 263 — Shared descriptor-safe storage read envelopes

`storage.local` state/cache result extraction now uses the shared plain-data field boundary after exact one-key envelope validation. Missing keys retain existing defaults, accessors are not executed, normal Proxy gets are not used, and descriptor changes produce deterministic read failures.

## 264 — Documentation and exact-head gate synchronization

This document, `ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through Milestone 264. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate and PR #7 remains draft.

## Validation status

Regression files added for Milestones 255–263 are **connector-created repository coverage only** in this environment. They were not executed here. No claim is made that `npm ci`, `npm run check`, package/release verification, reproducibility checks, source qualification, or real Chromium/Firefox qualification passed on this head.

GitHub-hosted Actions runner allocation remains blocked by the account billing/spending-limit state. That external limitation is neither a product failure nor successful validation.

No qualification checkbox should be checked from this block alone. Any real browser observation must be performed on the exact frozen source/package head recorded in Issue #10.
