# Milestones 1349–1358 — Qualification observation publication/lock integrity

This tranche hardens the local qualification-observation mutation path. It is **source-only supporting evidence**. It does not constitute Chromium or Firefox qualification, does not create browser observations, and does not change the authority of Issue #10.

## M1349 — Canonical observation output path

- Added one canonical `<root>/artifacts/qualification-observation.json` path contract.
- Root-bound writes reject relative, aliased, or noncanonical output targets.
- The real mutation path always supplies the repository root to the writer.

## M1350 — Stable artifacts parent identity

- The real `artifacts` parent must be a non-symlink directory.
- Device/inode identity is snapshotted before publication and revalidated before rename.

## M1351 — Stable observation target identity

- Existing observation targets must be regular non-symlink files.
- Existing target device/inode/size/mtime/ctime identity is revalidated after conflict checking and before rename.
- Explicitly expected missing targets must remain missing until publication.

## M1352 — Verified temporary publication

- Temporary files are created exclusively with `wx` and mode `0600`.
- Serialized UTF-8 bytes are written through an opened handle, fsynced, and handle-statted.
- The temporary file must remain regular and have the exact expected byte size before close.

## M1353 — Final publication verification

- After atomic rename, the canonical target is rechecked with `lstat`.
- The published path must be a regular non-symlink file with the exact serialized byte size.
- The artifacts parent identity is revalidated again after publication.

## M1354 — Stable lock parent identity

- Lock creation snapshots the same canonical real `artifacts` directory.
- Parent identity is checked after exclusive lock creation and again before cleanup.
- A replacement parent is never treated as the original lock scope.

## M1355 — Exact lock directory identity

- The just-created lock directory is snapshotted as a real non-symlink directory.
- Device/inode identity is revalidated before removal.
- A replacement lock path is never deleted.

## M1356 — Reconciled hardening inventory

- The bounded observation-hardening inventory now contains exactly six reviewed source files, including the canonical path/identity helper.
- Aggregate source review remains bounded to six 256 KiB entries.
- Hardening audit markers were reconciled to the current publication/lock implementation instead of carrying stale pre-hardening markers.
- Historical M1344/M1346/M1347 compatibility markers remain intact.

## M1357 — Composed publication integrity audit

- Added a focused source-only audit over the path/I/O/lock publication chain.
- It verifies confinement, identity checks, exclusive fsynced temporary publication, pre-rename ordering, final publication verification, and lock cleanup ordering.
- The audit is composed into the canonical observation hardening gate, which is already part of `npm run check`.

## M1358 — Closeout synchronization

- This document records the tranche as one canonical source-only unit.
- `ROADMAP.md` advances the next canonical milestone to M1359.
- Issue #10 receives supporting-evidence notes only; no browser PASS or qualification completion is claimed.

## Locked invariants

- Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate.
- Repository tests, audits, docs, markers, fixtures, and generated records are preflight/supporting evidence only.
- Real browser observations must be made on the same exact source head/fingerprint and exact candidate package identities.
- A source head/fingerprint/package-identity change invalidates prior browser observations.
- Qualification tooling retains zero telemetry, analytics, browsing/request history, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, embedded credentials/tokens, or owned Drop Ads backend behavior.
- Observation notes/version text remains bounded canonical local operator input; it is never harvested automatically from the host or browser.

`canonical M1358 qualification observation publication/lock integrity closeout verified`
