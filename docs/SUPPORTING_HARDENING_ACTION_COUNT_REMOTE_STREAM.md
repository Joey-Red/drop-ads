# Supporting hardening — action-count lifecycle and remote-stream work bounds

This note records hardening that landed alongside the repository's canonical numbered milestone sequence. It deliberately does **not** renumber or overwrite `ROADMAP.md` or existing `MILESTONES_*.md` blocks, because concurrent work already owns those milestone numbers.

## Protection-actions collaborator ownership

- Direct preference mutation captures `storage.local.get`, `storage.local.set`, and the optional browser-owned `declarativeNetRequest.setExtensionActionOptions` callable once, then reuses that operation set for prior-state read, display activation, persistence, and rollback.
- Storage-change `addListener` / optional `removeListener` methods are captured once for registration rollback and teardown; later event-method mutation cannot replace lifecycle behavior.
- Duplicate `installActionCount()` calls still apply exact top-level option-schema validation, then return the healthy existing registration before recapturing mutable logger/storage/DNR collaborators.
- Unsupported browsers may still persist the user's badge-display preference. Drop Ads does not observe or retain individual request events.

Focused repository coverage:
- `tests/action-count-transaction-capture-supporting.test.js`
- `tests/action-count-storage-event-capture-supporting.test.js`
- `tests/action-count-idempotent-reinstall-supporting.test.js`

## Background teardown and watchdog lookup boundaries

- Optional, mandatory-recovery, and core disposer methods are captured through bounded descriptor/prototype data inspection and bound to the original registration before lifecycle storage. Accessors and unsafe prototype paths fail closed; class-style prototype data methods remain supported.
- Refresh-watchdog `alarms.get()` results distinguish absence from a validated existing alarm. A present result must expose a descriptor-safe own enumerable string `name` exactly equal to `drop-ads:list-refresh-watchdog`; malformed, accessor-backed, trapped, or wrong-name results use the existing warning/fail-closed ready path.

Focused repository coverage:
- `tests/background-bootstrap-teardown-capture-supporting.test.js`
- `tests/refresh-watchdog-alarm-result-supporting.test.js`

## Remote-stream work bounds

The streamed remote-list path now layers explicit work/lifecycle constraints on top of the existing **5,000,000-byte** body ceiling and fatal UTF-8 decoding:

- streamed `Uint8Array` byte accounting uses the intrinsic typed-array byte-length accessor rather than ordinary `.byteLength` lookup;
- captured response header strings are bounded at **8,192 characters** before media-type or Content-Length parsing work;
- admitted nonterminal streamed byte chunks are capped at **65,536** per response, with one-over rejected and reader cancellation attempted best effort;
- optional reader `releaseLock` is captured with the original receiver and released best effort from shared cleanup without replacing the primary read result/error.

Existing Content-Length preflight, timeout/abort behavior, remote text/parser/rule ceilings, source admission, last-known-good semantics, and no-truncation policy remain unchanged.

## Validation statement

Connector-created or connector-edited regression coverage referenced here is repository coverage only and was **not executed** in this work session. No claim is made that `npm ci`, `npm run check`, packaging, release verification, reproducibility, source qualification, qualification-record generation, Chromium behavior, or Firefox behavior passed on the resulting head.

Issue #10 remains the authoritative exact-head Chromium + Firefox release gate and draft PR #7 must remain draft until that gate is satisfied.

No telemetry, analytics, browsing/request history, retained matched-rule or blocked-request statistics, page/DOM history, identifiers, cookie database access, custom backend, permission expansion, or retention expansion is introduced by this supporting hardening.
