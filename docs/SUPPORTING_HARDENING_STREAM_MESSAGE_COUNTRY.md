# Supporting hardening — stream, message guard, policy convergence, and country UI

This note records concurrent hardening landed after the canonical M451–M457 roadmap block without redefining milestone numbering. It introduces no telemetry, analytics, browsing/request history, retained match/page/DOM history, identifiers, custom backend, new permission, polling, or remote executable code.

## Stream byte accounting

Streamed remote-list byte accounting uses the intrinsic typed-array `byteLength` getter rather than ordinary `chunk.byteLength` property access. Uint8Array subclasses therefore cannot execute a shadowing getter during byte accounting, while the existing **5,000,000-byte** ceiling, fatal UTF-8 behavior, cancellation, timeout, and parser limits remain authoritative.

Focused repository coverage includes `tests/list-updates-stream-byte-length-v456.test.js` and `tests/remote-stream-byte-length-v456.test.js`.

## Remote response header preflight

Present remote response header values used by list admission must be primitive strings no longer than **8,192 characters** before `content-type` split/trim/lowercase work or `content-length` trim/regex/parse work. Missing headers remain supported. The existing document-media rejection and exact Content-Length byte preflight semantics are unchanged.

Focused repository coverage: `tests/list-updates-header-value-bound-v457.test.js` and the concurrently landed header-bound regression files.

## Runtime message-guard event ownership

The guarded runtime API captures the `runtime` namespace, `runtime.onMessage` event, required listener-add operation, and optional listener-remove operation through bounded descriptor/prototype data-property inspection. Captured event methods retain their original receiver through `Reflect.apply`; later accessor/method mutation cannot split registration/removal identity. Existing exact message schemas, duplicate suppression, registration rollback, logical-removal-first behavior, and core/cosmetic group routing remain unchanged.

Focused repository coverage: `tests/message-guard-event-capture-v458.test.js`.

## Policy-convergence namespace ownership

Policy convergence captures `runtime`, `contextMenus`, and `alarms` namespaces plus their reviewed event objects through the existing bounded descriptor/prototype data boundary before transactional event-method capture. Accessor/trapped namespace shapes fail before partial listener publication. Existing bounded discriminators/reasons, one-active-plus-one-rerun convergence, reverse rollback, teardown isolation, and source-of-truth policy semantics remain unchanged.

Focused repository coverage: `tests/policy-convergence-api-capture-v463.test.js`.

## Country mutation control recovery

Country Settings remove/mode mutations retain ownership of their original row/control while policy work is active. The row exposes `aria-busy`; `finally` clears busy state and re-enables the original control only when those nodes remain connected. A successful rerender may replace the row, in which case detached stale controls are not touched. Existing committed-success wording, bounded errors, focus recovery, and transaction behavior remain unchanged.

Focused repository coverage: `tests/options-country-mutation-recovery-v463.test.js`.

## Validation status

Connector-created or connector-edited regression coverage referenced here is repository coverage only and was **not executed** as local, package, Chromium, or Firefox validation in this work. No `npm ci`, `npm run check`, packaging/release verification, reproducibility verification, source qualification, qualification-record generation, or real-browser result is claimed.

Draft PR #7 remains intentionally draft. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate; any later source commit supersedes earlier exact-head observations or synchronization comments.
