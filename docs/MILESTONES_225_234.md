# Milestones 225–234 — Shared descriptor and collaborator hardening

This block continues the fail-closed boundary work around caller-controlled JavaScript objects and WebExtension event records. The changes are deliberately local: no telemetry, analytics, retained browsing/request history, user/device identifiers, custom backend, permissions, rule precedence, policy limits, or release-readiness claims are introduced.

Repository regression files added in this connector-only development block are **coverage only**. They are not represented as executed local tests, package verification, or Chromium/Firefox qualification.

## Milestone 225 — Trap-safe exact object schema validation

`assertPlainExactObject()` now contains `Object.getPrototypeOf`, `Reflect.ownKeys`, and `Object.getOwnPropertyDescriptor` traps and converts them to deterministic validation failures. Ordinary and null-prototype exact enumerable-data objects retain their existing semantics; symbols, accessors, hidden fields, arrays, custom prototypes, and unknown keys remain rejected without getter execution.

## Milestone 226 — Normal-array prototype enforcement for dense snapshots

`snapshotDenseDataArray()` now requires the normal `Array.prototype` in addition to its existing dense-own-index, no-symbol, no-extra-property, enumerable-data, and maximum-length checks. Prototype traps and altered array prototypes fail before entries are consumed; valid arrays still produce detached snapshots.

## Milestone 227 — Trap-safe import state subscription extraction

Import preflight subscription extraction now contains state prototype/descriptor traps and no longer uses the `in` operator, avoiding Proxy `has` traps. Present `subscriptions` data must be an own enumerable field on an ordinary/null-prototype state object; an absent field still means an empty collection. The existing dense 128-subscription work bound and canonical subscription normalization remain unchanged.

## Milestone 228 — Descriptor-safe import guard option reads

The optional import `preflight` callback is read from its validated own data descriptor rather than through normal property access. Omission still selects `preflightSettingsImport`; supplied values must still be functions. Listener identity, asynchronous preflight, and removal-race suppression are unchanged.

## Milestone 229 — Shared trap-safe plain-data field reader

`object-schema.js` now exports `readPlainDataField(value, key)`, a reusable field boundary for ordinary/null-prototype non-array objects. It contains prototype/descriptor traps, never invokes getters, and returns explicit safe/present/value state. Accessor, hidden, and custom-prototype fields are unsafe while absent fields are safely absent.

## Milestone 230 — Protection-actions installer adoption

The Protection-actions installer now reads validated `api`/`logger` options through the shared field reader. A supplied logger must expose `warn` as an own enumerable data-function; omitted logger behavior remains `console`. Storage preference reads/change routing also reuse the same reviewed descriptor boundary. Idempotence, the reviewed default preference, unsupported-browser behavior, and teardown race protection are unchanged.

## Milestone 231 — Refresh-watchdog collaborator adoption

The watchdog now reads validated options through the shared field reader and captures `controller.refreshListsOnce` only when it is an own enumerable data-function on an ordinary/null-prototype controller. Supplied logger `warn` receives the same treatment. The watchdog still calls the captured refresh path non-forced, preserves the 30-minute persistent alarm, and retains installation/disposal semantics.

## Milestone 232 — Policy-convergence collaborator adoption

Mandatory convergence now captures `controller.syncRules` through the shared descriptor boundary and requires supplied logger `error` to be an own enumerable data-function. Runtime/context/alarm string discrimination also uses the shared field reader. Coalescing, rerun ordering, idempotent registration, teardown, and recovery scope remain unchanged.

## Milestone 233 — Context-feedback shared field reads

Context feedback now uses the shared field reader for validated option values and browser-style event/result fields. Timing defaults and the 1–60,000 ms configuration bound remain unchanged, as do the 128 pending-entry cap, 128 visible-status cap, stale-generation protection, committed-state verification, exact-target cleanup fallback, and feedback wording.

## Milestone 234 — Documentation and exact-head gate synchronization

This milestone records the block, synchronizes `ROADMAP.md`, removes stale development-head language from draft PR #7, and records the resulting exact `agent/bootstrap-core` head on Issue #10. PR #7 remains draft and Issue #10 remains the release gate until clean preflight plus real Chromium and Firefox observations are recorded for the exact packaged head.
