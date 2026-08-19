# Milestones 134–143 — Event payload, cache schema, and fanout hardening

This block continues Drop Ads' browser-local privacy and reliability hardening. It does not add telemetry, browsing/request history, retained page/DOM history, identifiers, a statistics database, new permissions, or a Drop Ads backend.

## 134 — bounded context-feedback configuration

- right-click feedback timing overrides are validated before listeners are registered
- pending and visible timeouts must be finite integers from 1 through 60,000 ms
- injected timer functions must be callable
- invalid configuration retains no listeners or timers

## 135 — descriptor-safe context-feedback events

- context-menu targets, menu ids, frame ids, tab ids, storage changes, and cleanup acknowledgements are trusted only as own enumerable data fields
- inherited/accessor event fields are ignored without invoking getters
- committed-state verification, exact live-target cleanup, pending-cap eviction, and teardown remain unchanged

## 136 — descriptor-safe Protection actions preference events

- stored badge preference values and storage-change discriminators use own data fields only
- malformed/accessor/inherited preference loads fall back to the reviewed default-on setting
- no request observation or retained count data is introduced

## 137 — descriptor-safe refresh-watchdog alarms

- watchdog alarm names are read only as own enumerable data
- inherited/accessor alarm names cannot schedule refresh work
- the persistent 30-minute alarm and non-forced serialized refresh path remain unchanged

## 138 — immutable descriptor-safe tab fanout

- cosmetic refresh fanout structured-clones its message before the first send
- caller mutation cannot change later batches
- uncloneable messages fail before any tab receives work
- tab ids are accepted only from own enumerable data fields
- dedupe, the 32-send concurrency ceiling, complete valid-tab coverage, and per-tab failure isolation remain intact

## 139 — canonical bounded list-cache keys

- top-level persisted cache ids use the same 96-character subscription-id syntax as configured sources
- malformed/oversized/control-containing cache keys fail before entry decode
- existing 256-entry and 8,000,000-byte cache-container bounds remain unchanged

## 140 — descriptor-safe cache entry and rule-pack objects

- cache entry containers and packed network-rule objects must be ordinary/null-prototype enumerable data objects
- symbols, accessors, non-enumerable fields, arrays-as-objects, and custom prototypes fail closed without getter execution
- raw decode-work counting occurs only after the descriptor-safe snapshot boundary

## 141 — exact versioned cache schemas and finite refresh times

- v2, v3, v4, v5, legacy cache entries, and packed rule objects have reviewed field allowlists
- unknown metadata/history-style fields fail closed rather than being silently stripped
- refresh times are accepted only as finite numbers; coercion hooks are never called
- reviewed legacy migrations, integrity counts, and source binding remain supported

## 142 — safe background event field handling

- mandatory background runtime message, context-menu, alarm, and storage-change routing reads browser event fields through own enumerable data descriptors
- nested policy snapshots used for repair discrimination are copied without property getter or array-index getter execution
- malformed/inherited event data cannot queue policy mutations, list refresh, context blocks, or storage repair
- valid events still use the existing serialized transaction/repair queue

## 143 — canonical public cache source identity

- v5 cache source binding now shares the configured subscription boundary: allowed format plus public HTTPS source
- localhost, single-label, private/link-local, credential-bearing, malformed, and unknown-format source identities fail closed
- raw source URLs are capped at 4,096 characters and canonical URLs at 4,000 characters
- fragments are removed deterministically while query-bearing public feed identity is preserved
- legacy/unbound last-known-good cache remains migration-compatible and refresh-due as before

## Release status

Repository coverage added by these milestones is preflight only. Issue #10 remains the real Chromium + Firefox exact-head qualification gate, and PR #7 remains draft until that browser matrix is observed on one frozen commit/package fingerprint.
