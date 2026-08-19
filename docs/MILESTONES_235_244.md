# Milestones 235–244 — Cache and message descriptor hardening

This block continues the descriptor-safe boundary work without changing Drop Ads' privacy model, reviewed permissions, blocking semantics, remote-list limits, or release qualification rules.

## Milestone 235 — Descriptor-safe background bootstrap options and feature descriptors

- Background bootstrap and optional-feature install options are read through `readPlainDataField()` after exact-object validation.
- Optional feature `name` / `install` fields are captured as own enumerable data fields before startup work.
- Supplied logger `warn` callbacks are captured without executing accessors; omitted loggers still use the console.
- Existing 32-feature, 64-character-name, duplicate-name, failure-isolation, startup, and teardown behavior is retained.

## Milestone 236 — Trap-safe raw list-cache envelope inspection

- Raw cache root prototype, own-key, and per-entry descriptor inspection now contains Proxy traps.
- Cache entry getters are never executed.
- Existing canonical cache-key syntax, 256-entry cap, plain-object requirement, and enumerable-data-field rules remain unchanged.

## Milestone 237 — Trap-safe normal-array cache JSON snapshots

- Nested cache JSON arrays must be normal `Array.prototype` arrays.
- Length, own-key, and index descriptor inspection is trap-contained.
- Holes, accessors, symbols, extra properties, malformed metadata, and custom array prototypes continue to fail closed.
- Existing depth/node/byte ceilings remain unchanged.

## Milestone 238 — Trap-safe nested cache JSON object snapshots

- Nested cache JSON object prototype, own-key, and field-descriptor inspection is trap-contained.
- Only ordinary/null-prototype enumerable data objects are admitted.
- Getters, symbols, custom prototypes, functions, `undefined`, and non-finite numbers remain rejected.

## Milestone 239 — Detached raw list-cache root snapshots

- `snapshotRawListCache()` captures validated root entries into a null-prototype object.
- Subscription cache prune/network merge/cosmetic merge consumers now operate on that detached root instead of performing normal property reads on caller-controlled cache roots.
- Nested entries still pass through the existing cache codec, provenance, storage-byte, and LKG validation layers.

## Milestone 240 — Trap-safe tab fanout admission

- Optional `batchSize` is read through `readPlainDataField()` after exact option validation.
- Fanout no longer reads `tabs.length` normally before the dense snapshot; no total tab-count cap was introduced.
- Tab ids use the shared plain-data reader and retain non-negative-integer validation and deduplication.
- Existing 32-send concurrency, shared message snapshot, and failure isolation are unchanged.

## Milestone 241 — Detached top-level runtime message snapshots

- Exact runtime envelopes are copied into null-prototype snapshots through `readPlainDataField()` before action-specific validation.
- Validation no longer performs normal property reads on the original top-level message object.
- Safe type discrimination contains prototype/descriptor traps and does not execute accessors.

## Milestone 242 — Descriptor-safe nested runtime payload snapshots

- Nested network-rule, cosmetic-rule, and subscription payloads are detached through exact own-data snapshots before semantic normalization.
- Network `resourceTypes` are dense and capped at the existing 16-entry ceiling.
- Cosmetic `domains` / `excludedDomains` are dense and capped at the existing 64-entry ceiling.
- Nested accessors, holes, symbols, custom prototypes, and extra array properties fail before semantic work without getter execution.

## Milestone 243 — Descriptor-safe message-guard options

- `createMessageGuardedApi()` no longer destructures caller-owned options.
- `group` / `rejectUnknown` are exact descriptor-safe fields; `group` remains `core|cosmetic` and supplied `rejectUnknown` is strictly boolean.
- Omitted `rejectUnknown` retains the existing defaults: true for core, false for cosmetic.
- Listener identity, removal, group routing, and invalid-message response behavior remain unchanged.

## Milestone 244 — Documentation and exact-head release-gate synchronization

- This document and `ROADMAP.md` synchronize the hardening record through Milestone 244.
- PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.
- No current-head browser qualification is claimed by this block.

## Validation status

Regression files added during Milestones 235–243 are **repository coverage only** in this connector-driven work. They were not executed here, and this block does not claim `npm ci`, `npm run check`, package verification, reproducibility, source qualification, or real Chromium/Firefox qualification passed.

The release gate still requires a clean exact-head preflight/package/source-qualification run followed by the Issue #10 browser matrix against that same source head and generated package hashes. Any later source commit invalidates those observations.
