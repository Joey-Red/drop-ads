# Runtime Ownership Verification R1–R5

This independent verification track strengthens executable repository coverage for already-landed browser/runtime collaborator ownership boundaries. It deliberately does **not** consume or rewrite the concurrently owned canonical numeric milestone sequence in `ROADMAP.md`.

## R1 — Message guard event ownership

`createMessageGuardedApi()` is covered for one-time `runtime.onMessage` ownership: captured add/remove methods retain the original event receiver, later mutation of `addListener` cannot redirect registration, and accessor-backed runtime namespaces are rejected without executing their getter.

Coverage: `tests/message-guard-runtime-ownership-v458.test.js`.

## R2 — Import guard event ownership

`createImportGuardedApi()` receives the same executable ownership checks. Listener lifecycle stays attached to the originally captured event, later collaborator mutation cannot redirect it, and accessor-backed runtime namespaces fail closed without getter execution.

Coverage: `tests/runtime-ownership-r2-import-guard.test.js`.

## R3 — Session storage receiver ownership

Session `get`/`set` operations are exercised with callback-owned `bind` accessors that throw. The captured operations continue through receiver-preserving intrinsic invocation, while accessor-backed `storage.session` namespaces are rejected without getter execution. Existing strict save normalization and the 5,000-domain session ceiling are unchanged.

Coverage: `tests/session-storage-capture-v455.test.js`.

## R4 — Policy convergence receiver ownership

Policy-convergence controller and browser-event callbacks are exercised with poisoned callback-owned `bind` properties. Captured callbacks preserve their original receivers through intrinsic invocation; accessor-backed browser namespaces fail before partial listener publication. Existing idempotence, coalescing, bounded reason/discriminator text, transactional listener installation, and teardown isolation remain unchanged.

Coverage: `tests/policy-convergence-receiver-ownership-r4.test.js`.

## R5 — Action-count duplicate-install fast path

A healthy browser-owned action-count installation is reinstalled with hostile later logger/storage accessors. Executable coverage verifies the existing registration is returned after exact top-level option/API admission but before logger/browser collaborator recapture, while unknown top-level options remain rejected.

Coverage: `tests/runtime-ownership-r5-action-count.test.js`.

## Validation and privacy status

These files are repository coverage only. Connector-created coverage was **not executed** in this workflow. No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, Chromium run, or Firefox run is claimed.

No telemetry, analytics, browsing/request history, retained match/page/element data, identifiers, custom backend, new permissions, or retention expansion was introduced. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.
