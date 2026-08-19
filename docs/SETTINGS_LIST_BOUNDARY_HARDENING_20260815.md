# Settings and list boundary hardening — 2026-08-15

This note records a concurrent hardening batch that landed while the canonical milestone cursor was being reconciled by other work on `agent/bootstrap-core`. The issue titles created for this batch used M451–M455 labels, but this file deliberately does not redefine the canonical ROADMAP numbering.

## Settings backup export size

`createSettingsBackup()` now checks the serialized canonical backup against the same `MAX_SETTINGS_BACKUP_BYTES = 1_000_000` limit enforced by string import. A code-unit preflight runs before UTF-8 encoding and the exact UTF-8 byte count remains authoritative. The function fails rather than returning a backup that the extension would reject on re-import.

Repository coverage: `tests/settings-backup-export-byte-limit-v451.test.js`.

## Built-in subscription defaults during backup import

When a built-in subscription record omits optional `enabled`, import now preserves that built-in's canonical reviewed default instead of treating omission as `true`. Explicit primitive booleans still override the default exactly. External backup records keep their existing default-enabled migration behavior.

Repository coverage: `tests/settings-backup-built-in-default-v452.test.js`.

## Direct list-format admission

`parseList(text, format)` now admits only primitive non-empty format strings, caps direct format input at 32 characters, recognizes only `drop-ads-v1`, `third-party`, and `hosts`, and uses static rejection text. Hostile conversion hooks are not invoked or echoed during rejection.

Repository coverage: `tests/list-format-boundary-v453.test.js`.

## Native metadata schema version

`validateListMetadata()` now requires the exact safe-integer schema version `1` and rejects other values with static text. Boxed/type-confused values cannot execute conversion hooks through diagnostics.

Repository coverage: `tests/list-metadata-version-boundary-v454.test.js`.

## Subscription title text

Canonical `normalizeSubscription()` continues to support Unicode titles and the existing 120-character limit, while rejecting C0 controls, DEL, and U+2028/U+2029 line separators. This keeps runtime, persisted state, backup/import, and external-add title semantics aligned.

Repository coverage: `tests/subscription-title-text-v455.test.js`.

## Validation status

The files above are connector-created or connector-edited repository coverage only. They were not executed locally in this work session. No `npm ci`, `npm run check`, packaging, reproducibility, source qualification, or Chromium/Firefox runtime qualification is claimed by this note.

No telemetry, analytics, browsing/request history, retained statistics, identifiers, custom backend, permissions, or retention behavior was added.