# Milestones 451–452 — Backup round-trip and Protection-actions collaborator hardening

This block closes two post-M450 boundaries without changing Drop Ads' privacy or retention model. It adds no telemetry, analytics, browsing/request history, matched-element/page history, identifiers, custom backend, new permissions, polling, or remote executable code. Connector-created or connector-edited regression coverage described here is repository coverage only and was not executed as local/package/browser qualification.

## Milestone 451 — Keep exported settings backups inside the import byte ceiling

`createSettingsBackup()` now validates the serialized canonical backup against the same **1,000,000-byte UTF-8 ceiling** enforced by settings import. A cheap code-unit-length preflight runs before UTF-8 encoding; the UTF-8 byte count remains authoritative. An otherwise valid configuration that would serialize beyond the import ceiling fails export clearly instead of producing a backup Drop Ads cannot re-import.

The exact v1 backup schema, collection limits, domain/rule/cosmetic/subscription normalization, source handling, and privacy exclusions remain unchanged. Backups still contain configuration only—never list cache, session pause state, request/browsing history, statistics, identifiers, or timestamps.

Coverage: `tests/settings-backup-export-byte-limit-v451.test.js`.

## Milestone 452 — Capture Protection-actions storage event methods once

The optional browser-owned Protection-actions installer captures `storage.onChanged.addListener` and optional `removeListener` once through its bounded descriptor/prototype collaborator boundary. Installation rollback and teardown use only those captured receiver-safe callables, so later mutation of the event object cannot split listener ownership and callback-owned `bind` is never consulted.

The same action-count boundary also admits `storage`, `storage.local`, `storage.onChanged`, and `declarativeNetRequest` only through bounded data-property inspection. Accessor-shaped namespaces are rejected without getter execution while normal own/prototype browser data properties remain compatible under the reviewed depth-8 ceiling.

Idempotent installation, coalesced preference synchronization, rollback semantics, optional degradation, browser-owned badge behavior, and zero request observation/retention remain unchanged.

Coverage: `tests/action-count-collaborator-capture-v452.test.js` plus the canonical M449 action-count namespace regressions recorded in `docs/MILESTONES_445_450.md`.

## Qualification status

No claim is made that `npm ci`, `npm run check`, packaging, release verification, reproducibility, source qualification, qualification-record generation, Chromium behavior, or Firefox behavior was executed or passed by these connector changes. PR #7 must remain draft and Issue #10 remains the authoritative exact-head browser qualification gate. Any source commit after browser observation invalidates those observations.
