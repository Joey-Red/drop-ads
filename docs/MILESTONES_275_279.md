# Milestones 275–279 — Popup collaborator and UI-state boundaries

This block hardens the browser-owned/runtime-owned data that reaches the popup without changing blocking policy, permissions, persistence semantics, privacy guarantees, or the exact-head qualification gate.

## Milestone 275 — Descriptor-safe popup runtime response boundary

`src/core/popup-boundary.js` now validates popup runtime replies as exact ordinary/null-prototype own enumerable data containing only `ok`, optional `result`, and optional `error`. `ok` must be a real boolean. Accessors, hidden/symbol/unknown fields, custom prototypes, and descriptor traps fail before popup code consumes response values. Failed replies use only a non-empty string `error`; otherwise the caller-provided fallback is used.

`src/popup/popup.js` routes every policy request through this boundary. Regression coverage lives in `tests/popup-runtime-response-boundary.test.js`.

## Milestone 276 — Descriptor-safe popup active-tab boundary

The active-tab query result is snapshotted as a normal dense array with a popup-specific maximum of 16 candidates. The first candidate contributes only own enumerable data `id` and `url` fields. The id must be a non-negative safe integer and the URL must be a string; malformed/custom-prototype/accessor/trapped data yields no active page target. HTTP(S)-only site-control behavior remains unchanged.

Regression coverage lives in `tests/popup-active-tab-boundary.test.js`.

## Milestone 277 — Descriptor-safe popup storage-change routing

Popup storage-change routing now uses the shared trap-safe own-data field reader rather than bracket indexing the browser event container. Only the persisted-state key in the `local` area or the session-state key in the `session` area queues a committed-state render. Unrelated keys may coexist. Malformed/custom-prototype/accessor/trapped containers fail closed without getter execution.

Regression coverage lives in `tests/popup-storage-change-boundary.test.js`.

## Milestone 278 — Exact popup UI-state snapshot boundary

The `drop-ads:get-ui-state` result is validated before any popup render code sees it. The root must be exact own-data `{state, session}`. Persisted state is detached through the existing state snapshot boundary; session state is normalized with strict shape validation. Popup-consumed `enabled` and `cookieMode` scalars are checked explicitly, and the persisted/session domain arrays remain bounded by the existing 5,000-domain ceiling and must contain strings.

The helper returns only a frozen minimal popup view: global enabled state, cookie mode, persistent disabled sites, cookie exception sites, and session disabled sites. Runtime-owned state/session objects are not dereferenced later by rendering code.

Regression coverage lives in `tests/popup-ui-state-boundary.test.js`.

## Milestone 279 — Release-tooling and exact-head synchronization

The new runtime module `core/popup-boundary.js` is included in the generated-extension allowlist used by `tools/artifact-audit.mjs`; the build already copies the reviewed `src` tree and runtime-graph verification follows popup imports. ROADMAP and draft PR metadata are synchronized through this block, while Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.

## Validation status

The tests added in Milestones 275–278 are connector-created repository coverage only. They are **not represented as executed validation** in this work session. No claim is made that `npm ci`, `npm run check`, build/package verification, reproducibility verification, source qualification, qualification-record generation, or Chromium/Firefox manual qualification ran or passed on the resulting head.

Privacy invariants remain unchanged: no telemetry, analytics, browsing/request history, retained match/page/DOM history, identifiers, custom tracking backend, or new permissions were introduced.
