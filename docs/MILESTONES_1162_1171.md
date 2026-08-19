# Milestones 1162–1171 — Build-input fingerprint and discovery hardening

This sequence hardens the local source fingerprint that binds generated Firefox/Chromium artifacts to the reviewed repository state. Repository tests, audits, source hashes, generated metadata, and filesystem checks are supporting/preflight evidence only. Issue #10 remains the authoritative exact-head Chromium + Firefox browser qualification gate.

## M1162 — Bounded build-input hashing

Every build-input source hash now comes from a regular non-symlink file opened through a bounded handle. Each input is capped at 16 MiB before allocation/work, streamed bytes cannot grow beyond the opened size or byte ceiling, and both handle and pathname identity/size/time metadata are revalidated after hashing.

## M1163 — Aggregate fingerprint byte ceiling

Build-input collection admits at most 256 MiB of source bytes in aggregate in addition to the 16 MiB per-file ceiling. The aggregate advances as each descriptor is admitted and fails closed immediately above the limit.

## M1164 — Bounded discovery traversal

Recursive build-input discovery is centralized behind a shared helper and capped at 100,000 visited entries and 4,096 visited directories before further traversal.

## M1165 — Bounded per-directory enumeration

Source discovery uses `opendir()` iteration rather than whole-directory `readdir()` materialization. At most 8,192 entries may be admitted from one directory before deterministic sorting, and directory handles are closed through `finally`.

## M1166 — Fresh filesystem type admission

Directory-entry type hints are not trusted for source admission. Every child is classified from fresh `lstat` metadata; symlinks and unsupported types fail closed, recursion is limited to real directories, and only regular files enter the fingerprint set.

## M1167 — Canonical bounded source paths

Every discovered and fixed build-input path passes one canonical repository-relative path contract before hashing. Paths are forward-slash relative names capped at 1,024 UTF-8 bytes and reject empty, absolute, NUL, backslash, dot/dot-dot, escaping, and normalization-alias forms.

## M1168 — Directory identity revalidation

Each traversed directory is snapshotted before iteration, recursive directory admission is bound to the metadata observed for that child, and the directory is re-lstatted after traversal. Filesystem identity or size/time mutation during discovery fails closed.

## M1169 — Dedicated build-input hardening audit

`tools/build-input-hardening-audit.mjs` protects the M1162–M1168 byte, traversal, type, path, identity, and regression boundaries. It is exposed as `npm run build-input-hardening-audit` and retains the marker `canonical M1162-M1168 build input boundaries verified`.

## M1170 — Build/release gate integration

The existing `build-release-hardening-audit` invokes the dedicated build-input audit, preserving the historical build/release marker while adding `extended through M1169 build input fingerprint boundaries`. Canonical `npm run check` still has one build-release invocation and no duplicate direct build-input invocation.

## M1171 — Canonical synchronization

The roadmap, supporting-evidence guide, Issue #10 release gate, and regression coverage are synchronized for this sequence, stale exact-next-number coverage is reconciled, and canonical milestone allocation advances to M1172.

## Privacy and evidence boundary

These checks inspect only local repository paths, file bytes, and filesystem metadata needed to produce or verify a build fingerprint. They add no telemetry, analytics, browsing/request history, page/DOM snapshots, action outcomes, accessibility-name or consent retention, statistics, timestamps, locale/profile state, user/device identifiers, credentials, or owned Drop Ads backend behavior. Repository evidence never substitutes for real Chromium + Firefox observations recorded through Issue #10.
