# Milestones 451–458 — Export, collaborator, popup, and stream boundary hardening

This block continues Drop Ads' browser-local safety and accessibility hardening without adding telemetry, analytics, browsing/request history, retained match/page/DOM history, identifiers, a custom backend, new permissions, polling, or remote executable code. Connector-created or connector-edited regression coverage named below is repository coverage only and was not executed as local/package/browser qualification.

## Milestone 451 — Enforce settings-export byte compatibility

`createSettingsBackup()` verifies the canonical serialized v1 backup against the existing **1,000,000-byte** import ceiling. A cheap serialized character-count preflight runs before exact UTF-8 sizing, so export fails clearly rather than returning a backup Drop Ads would reject on re-import. Existing normalization semantics remain unchanged.

Coverage: `tests/settings-backup-export-byte-bound-v451.test.js`.

## Milestone 452 — Capture action-count storage event methods once

The Protection-actions installer captures storage-change `addListener` and optional `removeListener` before registration. Accessor-shaped methods fail without getter execution, failed registration uses the captured remover best effort, and later event mutation cannot replace disposal behavior. Idempotent installation, coalesced preference sync, and zero request observation/retention remain unchanged.

Coverage: `tests/action-count-storage-event-capture-v452.test.js`.

## Milestone 453 — Expose popup mutation busy state accessibly

The popup main region exposes `aria-busy`, backed by a released-once reference-counted mutation guard. Global protection, persistent site protection, session pause/resume, cookie exceptions, and picker start acquire/release busy state through existing recovery paths. Overlapping mutations cannot clear a newer busy state; passive storage rerenders and Settings navigation remain non-busy.

Coverage: `tests/popup-busy-state-v453.test.js`.

## Milestone 454 — Store optional registrations through intrinsic Map operations

Optional feature registration storage uses intrinsic `Map.prototype` operations against the already-admitted Map receiver, so a poisoned/replaced `registrations.set` property cannot redirect registration storage. Genuine Map/Map-subclass semantics, reverse teardown ordering, and optional-feature failure isolation remain unchanged.

## Milestone 455 — Preserve newer popup site feedback across stale renders

Popup site/session feedback has a revision/ownership channel. Committed-state renders capture the current site-status revision and publish durable session-pause text only while they still own it. Site, cookie, pause, and picker operations publish through the owned channel, so an older successful refresh cannot erase newer applying/error feedback.

Coverage: `tests/popup-site-status-revision-v455.test.js`.

## Milestone 456 — Use intrinsic typed-array byte length for streamed chunks

Remote-list streamed byte accounting obtains Uint8Array byte length from the intrinsic typed-array accessor through `Reflect.apply`, rather than ordinary `chunk.byteLength`. Uint8Array subclasses remain supported without executing a shadow accessor, and detached/invalid views fail before byte accounting/decoder work. The existing **5,000,000-byte** body ceiling and fatal UTF-8 behavior remain authoritative.

Coverage: `tests/list-stream-byte-length-v456.test.js`.

## Milestone 457 — Lock exact optional refresh-force message semantics

The runtime message contract distinguishes omission of `force` from an explicitly present value. Omission remains valid and non-forced; primitive `true`/`false` are valid when present; `null`, `undefined`, strings, numbers, boxed booleans, and objects fail validation. The direct controller strict-force boundary remains unchanged.

Coverage: `tests/runtime-refresh-force-message-v457.test.js`.

## Milestone 458 — Keep external-subscription admission descriptor-safe before work

Direct external-subscription input is snapshotted through the exact own-data boundary before copying or downstream state/cache/source/DNR/persistence work. Accessor fields fail without getter execution and normal-get proxy hooks are not used during admission. External semantics still force `builtIn: false`, while id/source dedupe, fetch-before-persist, activation, and rollback remain unchanged.

Coverage: `tests/runtime-external-subscription-admission-v458.test.js`.

## Validation and release status

No claim is made here that `npm ci`, `npm run check`, packaging, release verification, reproducibility verification, source qualification, qualification-record generation, Chromium behavior, or Firefox behavior was executed or passed. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. Any later source commit invalidates earlier browser observations.
