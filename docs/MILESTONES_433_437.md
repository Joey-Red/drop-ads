# Milestones 433–437 — Remote body, cache, and runtime response boundaries

This block continues exact-head hardening without changing Drop Ads privacy, permissions, retention, blocking precedence, or serverless operation.

## Milestone 433 — Bound direct remote-list text before structural scanning

Direct `assertRemoteListTextStructure()` input now rejects text over **5,000,000 characters** before NUL/line scanning. The character ceiling is numerically locked to the existing **5,000,000-byte** download ceiling, so every downloaded UTF-8 source admissible by bytes remains admissible by character count. Existing **300,000-line** and **16,384-character line** limits remain authoritative afterward.

Coverage: `tests/list-text-total-bound-v432.test.js`.

## Milestone 434 — Capture remote response body collaborators once

`readResponseTextBounded()` now snapshots the response body once and captures/binds native-compatible `ReadableStream.getReader` and `Response.text` collaborators before body parsing. Synthetic response/body collaborators must be safe own enumerable data functions. Native Chromium/Firefox platform `Response` / `ReadableStream` prototypes remain supported. Streaming preference, text fallback, fatal UTF-8, timeout, and byte ceilings are unchanged.

Coverage includes `tests/list-response-body-collaborators-issue551.test.js`.

## Milestone 435 — Contain legacy cache array-kind and length inspection

Legacy cache admission now contains revoked/throwing array-kind checks. Real legacy policy arrays must pass the normal dense-array snapshot before work counting/migration; uninspectable/sparse/accessor/custom arrays invalidate the entry rather than leaking native failures. Raw counting uses detached array length descriptors. Ordinary non-array legacy compatibility fallback remains unchanged under the existing **300,000 raw policy-item** ceiling.

Coverage includes `tests/cache-codec-legacy-array-admission-issue541.test.js`.

## Milestone 436 — Bound and isolate core runtime response failures

Core background runtime failure responses admit only a non-empty own-data `message` string under the exported **1,024-character** ceiling. Hostile/accessor/oversized/type-confused thrown values use the existing action-specific bounded fallback. Settings-import source-failure composition stays within the same ceiling, and asynchronous success/failure response delivery is best effort so a closed response channel cannot create a secondary unhandled failure.

Coverage includes `tests/runtime-response-error-bound-issue543.test.js`.

## Milestone 437 — Regression alignment and exact-head synchronization

Prototype-sensitive optional-feature status behavior is explicitly regression-covered: null-prototype frozen status records treat names such as `__proto__` / `constructor` as inert own keys, preserving the already-reviewed Milestone 401 implementation. This milestone also synchronizes the roadmap, draft PR metadata, and Issue #10 exact-head release gate after M433–436.

Coverage includes `tests/background-bootstrap-status-prototype-v432.test.js`.

## Validation status

Connector-created/edited regression coverage in this block is repository coverage only and was **not executed locally or in Chromium/Firefox here**. No `npm ci`, `npm run check`, package/release verification, reproducibility, source qualification, or browser qualification result is claimed. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.
