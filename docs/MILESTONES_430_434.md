# Milestones 430–434 — Shared collection and reader boundary hardening

## Milestone 430 — Allocation-safe dense-array admission

The shared `snapshotDenseDataArray()` boundary now rejects sparse/extra-property shapes from their actual own-key metadata before allocating an expected-index collection or detached result proportional to a hostile declared length.

- the caller's reviewed `maxLength` remains authoritative
- the array must still use the normal `Array.prototype`
- revoked/uninspectable metadata still fails closed
- exactly one `length` key plus canonical decimal indices in `[0, length)` are required
- symbols, holes, noncanonical index strings, and extra properties are rejected
- accepted entries remain own enumerable data fields and are detached before return

Coverage: `tests/object-schema-dense-array-allocation-v430.test.js`.

## Milestone 431 — Subscription collection array-kind containment

Subscription collection compatibility boundaries now contain `Array.isArray()` failures instead of leaking native revoked-Proxy exceptions.

- direct revoked/throwing subscription collection input fails deterministically before normalization
- an ordinary non-array collection retains the reviewed built-in-only compatibility fallback
- decoded cache network/cosmetic append helpers treat uninspectable/revoked collection kinds as malformed data that contributes no policy
- the existing **128-subscription** ceiling, cache provenance, remote-rule safety, and precedence semantics are unchanged

Coverage: `tests/subscription-array-kind-v431.test.js`.

## Milestone 432 — Transactional Protection-actions listener ownership

The browser-owned Protection-actions optional feature now owns its storage-change listener transactionally.

- the exact storage-change event collaborator is captured before registration
- absent optional storage surfaces retain the existing no-op registration behavior
- a present event surface must provide `addListener()`
- an add-then-throw registration is best-effort removed before the original error is rethrown
- disposal marks the registration inactive before external teardown, uses the captured event, isolates removal failure, and always releases installation identity for reinstall
- serialized preference synchronization, default-enabled fallback, and zero request observation/history are unchanged

Coverage: `tests/action-count-listener-lifecycle-v432.test.js`.

## Milestone 433 — Streamed byte-chunk view admission

Remote-list streamed reader results now reject Proxy-wrapped/revoked chunk objects before `Uint8Array` prototype inspection.

- `ArrayBuffer.isView()` is used as a non-coercive first gate
- only actual `Uint8Array` views then reach the existing `instanceof Uint8Array` compatibility check, preserving legitimate subclasses
- Proxy wrappers, including revoked Proxies, fail through the reviewed invalid-byte-chunk error path
- exact `{done,value?}` reader envelopes, terminal-result rules, byte ceilings, fatal UTF-8 decoding, and best-effort reader cancellation are unchanged

Coverage: `tests/list-reader-byte-chunk-v433.test.js`.

## Milestone 434 — Documentation and exact-head release-gate synchronization

This milestone synchronizes the M430–433 boundaries into the roadmap, draft PR metadata, and Issue #10 exact-head qualification record without changing the release decision.

Connector-created or connector-edited regression coverage in this block is repository coverage only and is **not represented as executed local/package/browser validation**. The exact current head still requires the clean preflight/package/source-qualification sequence and real Chromium + Firefox observations before PR #7 can leave draft state.

No telemetry, analytics, browsing/request history, retained matched-element history, user/device identifiers, custom backend, or permission expansion is introduced by this block.
