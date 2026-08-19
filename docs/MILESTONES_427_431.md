# Milestones 427–431 — Collection and browser collaborator hardening

This block continues Drop Ads' fail-closed browser-local hardening without changing Firefox/Chromium policy semantics, permissions, precedence, serverless operation, or the zero-telemetry/zero-history retention model. Connector-created or connector-edited regression coverage is repository coverage only and was not executed as local/package/browser qualification in this workflow.

## Milestone 427 — Bound direct personal conflict collections

Direct personal allow/block conflict inputs are admitted through the shared normal dense enumerable-data array boundary at the existing **10,000 personal-network-rule** ceiling before canonical rule-key work. Sparse, accessor, custom-prototype, revoked, and extra-property arrays fail closed instead of changing conflict semantics or escaping validation.

Coverage: `tests/rule-conflicts-collection-bound-v427.test.js`.

## Milestone 428 — Contain direct cosmetic collection array-kind failures

Direct cosmetic rule normalization and stylesheet selector admission contain throwing/revoked array-kind inspection before their existing dense/work boundaries. Ordinary non-array compatibility remains unchanged, while revoked values fail deterministically. Existing **300,000 cosmetic-rule collection / 2,048 selector / 512 selector-character / 256 KiB stylesheet** ceilings remain authoritative.

Coverage: `tests/cosmetic-collection-array-kind-524.test.js` (historical issue-number filename retained).

## Milestone 429 — Contain cache-codec record array-kind traps

Cache-codec plain-record admission contains array-kind inspection before prototype/key/descriptor work so revoked or otherwise uninspectable record values produce the same invalid-cache outcome rather than leaking native revocation failures. Existing ordinary/null-prototype exact schemas, dense nested arrays, source provenance, count integrity, and **300,000 raw policy-item** limits remain unchanged.

Coverage: `tests/cache-codec-revoked-record-v429.test.js`.

## Milestone 430 — Snapshot remote-list response metadata before body admission

Remote-list downloads detach the `ok`, `redirected`, `status`, and `headers` metadata needed for admission before body parsing. Native platform `Response`/`Headers` access is performed through reviewed native prototype descriptors, while synthetic responses require safe own-data metadata/collaborators. The header getter is captured and receiver-bound once for Content-Type and Content-Length checks. Accessor/proxy/type-confused synthetic metadata fails closed before consuming the body. Redirect rejection, media-type rejection, timeout, fatal UTF-8, and the **5,000,000-byte** download ceiling remain unchanged.

Coverage includes `tests/list-response-metadata-v430.test.js` and the focused response-metadata regression coverage retained in-tree.

Supporting work in this sequence also contains revoked subscription collection array-kind admission, requires primitive direct personal-domain mutation flags, and preflights raw personal-rule text before trim/normalization without weakening the canonical **16,384-character** network-rule value boundary.

## Milestone 431 — Capture refresh-watchdog alarm collaborators and make startup rollback-safe

The refresh watchdog captures its alarm event and `get` / `create` / listener collaborators once with their browser receiver semantics. Initial listener registration is transactional: a thrown registration attempt marks the local installation inactive, best-effort removes the exact listener, publishes no installation identity, and rethrows the original failure. Promise-returning and synchronous/void `alarms.create()` implementations are both supported; readiness waits for asynchronous creation and reports success only while the installation is still active. Existing persistent **30-minute**, non-forced, serialized refresh behavior is unchanged.

Coverage includes `tests/refresh-watchdog-event-capture-v430.test.js`, `tests/refresh-watchdog-listener-rollback-v431.test.js`, and `tests/refresh-watchdog-create-promise-v432.test.js` (historical filename retained).

## Release-gate state

These milestones are repository hardening only. No `npm ci`, repository test suite, package/release verification, reproducibility verification, source qualification, qualification-record generation, Chromium run, or Firefox run is claimed from connector-only work. PR #7 must remain draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained request/rule/matched-element statistics, page/DOM history, user/device identifiers, cookie-database access, a custom Drop Ads backend, new permissions, or executable remote code.
