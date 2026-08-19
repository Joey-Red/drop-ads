# Milestones 458–467 — Remote input and collaborator boundary continuation

This document is the canonical post-M457 continuation for the `agent/bootstrap-core` development line. `ROADMAP.md` owns milestone numbering. Earlier issue/test filenames with overlapping temporary suffixes are retained as historical repository evidence only; they do not redefine the sequence below.

No connector-created or connector-edited regression coverage described here was executed locally. This document does not claim `npm ci`, `npm run check`, packaging, release verification, reproducibility verification, source qualification, qualification-record generation, Chromium execution, Firefox execution, or product readiness.

## M458 — Intrinsic streamed typed-array byte accounting

Remote streamed body chunks that pass the `Uint8Array` admission boundary are measured through the intrinsic typed-array byte-length accessor with the admitted chunk as receiver. A subclass/shadowing `byteLength` getter is not executed, and detached/invalid views fail before byte accounting or decoder work. The existing **5,000,000-byte** total body ceiling and fatal UTF-8 behavior are unchanged.

Focused repository coverage includes `tests/remote-stream-byte-length-v456.test.js` / `tests/list-updates-typed-array-byte-length-v456.test.js`; their historical suffixes predate canonical reconciliation.

## M459 — Bound captured remote response header values

Captured `content-type` and `content-length` header values must be primitive strings no longer than **8,192 characters** before split/trim/lowercase/regex/number parsing work. Missing headers remain supported. Existing document-media rejection and strict Content-Length byte preflight semantics are unchanged.

Focused repository coverage: `tests/remote-response-header-bound-v457.test.js`.

Additional landed streamed-body hardening from concurrent trackers is preserved as supporting evidence rather than competing canonical milestones: admitted nonterminal byte chunks are capped at **65,536** per body, and optional reader `releaseLock()` is captured once and invoked best effort on every exit without replacing the primary result/error.

## M460 — Timeout-controller cleanup regression alignment

Focused timeout-controller coverage locks the reviewed behavior around cleanup and hostile synthetic controller shapes. Throwing timer cleanup cannot replace successful task completion, and accessor-shaped synthetic AbortController state fails before timer scheduling. The source timeout contract remains **1–120,000 ms**, default **30,000 ms**, with the already-reviewed arm-before-task and synchronous-expiry handling.

Focused repository coverage: `tests/list-timeout-controller-v438.test.js`; the filename is historical.

## M461 — Strict direct message-validator group admission

The shared message-group boundary admits only primitive `core` or `cosmetic` strings. Direct validation rejects invalid/type-confused group input before runtime-message snapshot work, while valid messages belonging to the other reviewed group retain `{handled:false}` semantics. The guarded installer shares the same boundary so direct and installed validation cannot drift.

Focused repository coverage: `tests/message-validator-group-v456.test.js`.

Supporting import-guard runtime/onMessage ownership and bind-free forwarding work remains landed under historical trackers but does not reuse canonical M461 numbering.

## M462 — One-shot message-guard option snapshot

`createMessageGuardedApi()` detaches one exact descriptor-safe `{group,rejectUnknown?}` options snapshot before collaborator setup and consumes only that snapshot afterward. `rejectUnknown` remains a primitive boolean when supplied and preserves the reviewed core/cosmetic default behavior.

Focused repository coverage: `tests/message-guard-options-v457.test.js`.

## M463 — Policy-convergence namespace/event capture

Mandatory policy convergence captures the `runtime`, `contextMenus`, and `alarms` namespaces plus their relevant event objects through the existing bounded descriptor/prototype data-property boundary before receiver-bound event-method capture. Accessor/trapped namespace shapes fail before partial listener publication. Transactional reverse rollback, teardown isolation, bounded reasons/discriminators, and one-active-plus-one-rerun convergence semantics remain unchanged.

Focused repository coverage: `tests/policy-convergence-api-capture-v463.test.js`.

## M464 — Session-storage method ownership

Session persistence contains `storage` / `storage.session` namespace access through bounded descriptor/prototype inspection, captures required `get` / `set` operations with the original storage-area receiver, and invokes them through `Reflect.apply` without consulting callback-owned `bind`. Missing session storage retains the reviewed load-default/save-error behavior. Exact envelope validation, strict write normalization, the **5,000-domain** ceiling, and session-only semantics remain unchanged.

Focused repository coverage: `tests/session-storage-capture-v455.test.js`.

Country Settings row-control recovery landed concurrently and remains supporting Settings hardening; its old temporary M464 suffix was removed to keep this canonical sequence unambiguous.

## M465 — Action-count duplicate-install fast path

Protection-actions keeps exact top-level option-schema validation first, then reads the descriptor-safe API option and returns an existing installation before logger/browser collaborator recapture. Once a healthy installation exists, later mutation of optional collaborators cannot make a duplicate install fail. First-install validation, unsupported-API degradation, preference behavior, teardown/reinstall behavior, and zero request observation/retention remain unchanged.

Focused repository coverage includes `tests/action-count-reinstall-idempotence-v456.test.js` and historical aligned coverage.

## M466 — Preserve built-in subscription defaults on backup import

When a built-in settings-backup record omits optional `enabled`, import inherits that canonical built-in subscription's reviewed default instead of forcing every built-in on. An explicitly present primitive boolean still overrides the default. External backup records retain their existing migration default. Exact backup schemas, built-in id validation, and the **128-subscription** ceiling remain unchanged.

Focused repository coverage: `tests/settings-backup-built-in-default-v452.test.js`.

## M467 — Canonical documentation and exact-head release synchronization

This milestone reconciles the M458–466 implementation/regression evidence into one ROADMAP sequence, classifies overlapping temporary suffixes as supporting historical evidence, synchronizes draft PR #7 without hardcoding its current head, and records the final exact implementation head on Issue #10.

The release rule remains unchanged: PR #7 stays draft until a clean checkout of the exact same head completes the documented machine preflight/package/source-qualification sequence and real Chromium plus Firefox qualification. Any source commit after browser observation invalidates those observations.

## Privacy and retention invariants

Nothing in M458–467 adds telemetry, analytics, browsing history, request history, retained matched-rule/blocked-request history, per-site/lifetime statistics, page/DOM history, identifiers, cookie-database access, remote executable code, a custom Drop Ads backend, or new permissions. Remote inputs remain hostile declarative data with bounded work and fail-closed admission.
