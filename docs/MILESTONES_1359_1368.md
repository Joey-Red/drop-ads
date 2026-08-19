# Milestones 1359–1368 — Qualification observation root/temp/read integrity

This tranche hardens the local qualification-observation persistence boundary. It is **source-only supporting evidence**. It does not create, infer, or replace Chromium or Firefox observations. Issue #10 remains the authoritative exact-head browser qualification gate.

## M1359 — Stable repository-root identity

Qualification observation publication snapshots the resolved repository root as a real non-symlink directory with frozen device/inode identity. The same root is revalidated immediately before rename and again after final publication verification.

## M1360 — 128-bit temporary-name entropy

Temporary publication suffixes use `randomBytes(16)` and lowercase hexadecimal encoding, providing a 128-bit cryptographic suffix while retaining exclusive `wx` creation and mode `0600`.

## M1361 — Opened temporary-file identity binding

After writing, fsync, and exact byte-size verification, the opened temporary file's device/inode/size/mtime/ctime identity is captured. The pathname must still resolve to that exact regular non-symlink identity immediately before rename.

## M1362 — Identity-safe failed-temp cleanup

A failed publication never unconditionally removes the temporary pathname. Cleanup runs only after an exact temporary-file identity was captured and only when the pathname still matches that identity. Missing, replaced, or otherwise unowned paths are left untouched, and cleanup never replaces the original publication error.

## M1363 — Descriptor-safe writer options

Writer options are snapshotted before filesystem work. Only optional `expectedCurrentText` and `rootDirectory` enumerable own data fields are accepted from ordinary/null-prototype objects. Accessors, symbols, extras, arrays, and custom prototypes fail closed without getter execution.

## M1364 — Canonical temporary-path construction

Temporary paths are produced only through the shared path helper. The suffix must be exactly 32 lowercase hexadecimal characters and the temporary filename remains in the exact output parent with the exact output basename plus `.pending-<suffix>`.

## M1365 — Identity-safe qualification file reads

Shared qualification UTF-8 file reads `lstat` the pathname before open, reject symlinks/special files, bind the opened handle to the same device/inode/size/mtime/ctime identity, revalidate after bounded reading, and revalidate the pathname after close. Strict UTF-8, byte ceilings, and explicit `allowMissing` behavior remain intact.

## M1366 — Shared dependency review

The exact observation-hardening/privacy inventory now includes eight bounded sources, adding `qualification-file-io.mjs` and `qualification-json-data.mjs`. The hardening gate reviews identity-safe reads plus descriptor-safe bounded JSON cloning/stringification and preserves the existing privacy audit over the same exact inventory.

## M1367 — Composed publication/read integrity audit

The publication audit now covers writer-option admission, 128-bit canonical temporary paths, fsynced opened-temp identity, identity-safe conflict reads, temporary/target/artifacts/root revalidation ordering, final publication verification, identity-safe cleanup, and lock identity cleanup. It preserves the historical M1357 marker and adds `canonical M1367 qualification observation publication/read integrity verified`, surfaced through the canonical hardening gate.

## M1368 — Closeout synchronization

This document, the M1368 closeout regression, ROADMAP history/next-number synchronization, and the Issue #10 supporting-evidence note close the tranche. No connector-created source test or audit in this tranche is represented as executed browser evidence.

## Locked invariants

- Issue #10 remains the sole authority for real Chromium + Firefox qualification on the same exact source head, source fingerprint, and candidate package identities.
- Source-only tests, audits, markers, documentation, and generated records never synthesize browser success.
- Qualification observation tooling retains zero telemetry, analytics, browsing/request history, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, embedded credentials/tokens, or owned Drop Ads backend behavior.
- Observation publication is confined to the canonical repository artifact target when repository binding is supplied.
- Publication requires stable repository-root, artifacts-parent, existing-target, temporary-file, and final-target identity checks as applicable.
- Failure cleanup never deletes a pathname that was not proven to be the same temporary file created by this publication attempt.
- Shared qualification file reads are bounded, strict UTF-8, regular non-symlink, and identity-stable across pathname admission, opened-handle reading, and final pathname revalidation.
- The observation hardening/privacy source inventory is exact, bounded, immutable, and includes shared file-I/O and JSON-data dependencies.

Closeout marker: `canonical M1368 qualification observation root/temp/read integrity closeout verified`.
