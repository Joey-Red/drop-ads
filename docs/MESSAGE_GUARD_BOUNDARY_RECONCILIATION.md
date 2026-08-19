# Message-guard boundary reconciliation

This note records message-guard hardening that landed while independent milestone writers were extending `agent/bootstrap-core`. It intentionally does **not** claim the already-occupied `MILESTONES_456_460.md` sequence or renumber canonical `ROADMAP.md` history.

## Direct validator group admission

The exported direct validator accepts only primitive `core` or `cosmetic` groups before runtime-message snapshot work. Valid messages from the other reviewed group remain an ordinary `handled: false` result rather than an error.

Focused repository coverage includes `tests/message-validator-group-v456.test.js`.

## One-shot guard option snapshot

`createMessageGuardedApi()` detaches one exact descriptor-safe `{group, rejectUnknown?}` option record before collaborator setup and consumes only that snapshot afterward. The default remains `rejectUnknown: true` for core and `false` for cosmetic; an explicitly supplied value must remain a primitive boolean.

Focused repository coverage includes `tests/message-guard-options-v457.test.js`.

## Runtime/event collaborator ownership

The guarded API captures `api.runtime`, `runtime.onMessage`, required `addListener`, and optional `removeListener` through the bounded descriptor/prototype data-property boundary. Event methods retain their original receiver through `Reflect.apply`; accessor/trapped/revoked collaborator shapes fail deterministically without ordinary getter execution. Wrapper identity, duplicate-listener suppression, failed-registration rollback, logical-removal-first teardown, and cross-group routing remain unchanged.

Focused repository coverage includes `tests/message-guard-runtime-event-v458.test.js` and `tests/message-guard-event-capture-v458.test.js`.

## Bind-free runtime forwarding

Non-`onMessage` function-valued runtime properties preserve the runtime receiver through intrinsic `Reflect.apply` forwarding. Callable-owned `.bind` is never read or invoked. Non-function runtime properties still pass through, and the guarded `onMessage` substitution is unchanged.

Focused repository coverage includes `tests/message-guard-runtime-forwarding-reflect-apply.test.js`.

## Validation and privacy status

Connector-created or connector-edited regression coverage named here is repository coverage only and was **not executed as local/package/browser validation** in this workflow. No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, Chromium run, or Firefox run is claimed.

These boundaries add no telemetry, analytics, browsing/request history, retained statistics or matched-element/page history, identifiers, custom backend, new permissions, cookie-database access, or remote executable code. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.
