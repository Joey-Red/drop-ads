# Milestones 280–284 — Settings page response and event boundaries

This block hardens Settings-page collaboration with the background/runtime and browser storage event surface. It does not add telemetry, retained browsing/request history, identifiers, a backend, permissions, or new blocking behavior.

## Milestone 280 — Descriptor-safe Settings runtime response boundary

`src/core/options-boundary.js` now owns the generic Settings response envelope used by `runtimePolicy()`.

- Accepted success/failure root shape is exact ordinary/null-prototype own enumerable data: `{ ok, result?, error? }`.
- `ok` must be a real boolean.
- Accessors, inherited/custom-prototype fields, unknown fields, and descriptor traps fail closed rather than being dereferenced.
- Failed replies surface only a non-empty string `error`; otherwise the caller-provided fallback remains authoritative.
- Successful calls return only the validated own-data `result` value.

Repository regression: `tests/options-runtime-response-boundary-v280.test.js`.

## Milestone 281 — Descriptor-safe Settings storage-change routing

The Settings `storage.onChanged` listener no longer indexes the browser-supplied change container directly.

- `isRelevantOptionsStorageChange()` recognizes only the local-area Drop Ads persisted-state key through the shared own-data descriptor boundary.
- Unrelated storage keys may coexist without forcing a render.
- Accessor/custom-prototype/Proxy-trapped containers fail closed without getter execution.
- Existing internal-mutation suppression and queued render coalescing are unchanged.

Repository regression: `tests/options-storage-routing-v281.test.js`.

## Milestone 282 — Exact Settings action-response schemas

All remaining Settings direct `runtime.sendMessage()` reply consumers are routed through action-specific schemas.

- Community preparation: exact `{ ok, error? }`.
- Subscription add/enable/remove: exact `{ ok, subscription?, error? }` with detached nested fields. The result requires a non-empty `id`; optional `title` remains bounded to 120 characters; optional `enabled` is boolean; optional `source` is limited to the reviewed `unchanged`, `cache`, `none`, `bundled`, or `fetched` states.
- List refresh: exact `{ ok, status?, error? }` with status limited to `updated`, `updated-with-fallback`, `fallback`, or `current`.
- Settings import: exact `{ ok, subscriptions?, fetchedSources?, error? }`; counts are non-negative safe integers, subscriptions remain within the existing 128-record ceiling, and fetched sources remain within the existing 16 uncached-activation ceiling.

This changes only how the Settings page admits and detaches collaborator replies before rendering status text; successful policy/list/import semantics remain the existing background behavior.

Repository regression: `tests/options-action-response-boundary-v282.test.js`.

## Milestone 283 — Generated-content admission for the Settings boundary

The shared generated extension allowlist now explicitly includes `core/options-boundary.js` for Chromium and Firefox.

- Admission remains per-file and exact; no directory wildcard was added.
- Repository-only and sensitive-file rejection remains unchanged.
- The normal source-copy build therefore ships the Settings boundary while generated-content auditing can still reject both missing reviewed files and unexpected runtime files.

Repository regression: `tests/options-boundary-artifact-v283.test.js`.

## Milestone 284 — Documentation and release-gate synchronization

This document, `ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through Milestone 284. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.

## Validation status

The M280–284 regression files above were added through the GitHub connector as **repository coverage only**. They were not executed locally in this work session, and no Chromium/Firefox package or runtime qualification is claimed from these changes.

A clean exact-head preflight/package/source-qualification run plus real Chromium and Firefox observations remains required before PR #7 can leave draft state.
