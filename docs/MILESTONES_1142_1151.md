# Milestones 1142–1151 — Generated build output I/O hardening

This sequence extends the atomic output and bounded-source discipline into the unpacked Firefox/Chromium build path. Repository tests, audits, generated trees, hashes, and structural checks are supporting/preflight evidence only. Issue #10 remains the authoritative exact-head Chromium + Firefox browser qualification gate.

## M1142 — Shared cryptographic build temp names

Canonical build metadata publication now uses the same same-parent `randomBytes(16)` temporary-path helper as release/package outputs instead of `Math.random`, while retaining exclusive `wx` creation, private `0600` mode, fsync, rename, and cleanup.

## M1143 — Build parent identity revalidation

Build output publication snapshots the real output parent before temporary-file creation and revalidates filesystem identity immediately before rename. Parent symlink substitution, wrong type, or device/inode replacement fails closed.

## M1144 — Published build output verification

After atomic rename, the final build output must be a regular non-symlink file with exactly the expected byte size before publication returns success.

## M1145 — Canonical bounded build output paths

Build outputs accept only canonical forward-slash repository-relative paths under `dist/`, reject empty/dot/dot-dot/alias/backslash/NUL/absolute forms, and enforce a 1,024-byte UTF-8 path ceiling.

## M1146 — Real build output ancestry

The repository root and every directory component through the build output parent must be real non-symlink directories. Directory ancestry is bounded to 32 components before publication proceeds.

## M1147 — Atomic binary build output

A 16 MiB bounded binary build-output writer now applies the same canonical path, ancestry, cryptographic temp, parent revalidation, exclusive write, fsync, atomic rename, final type/size, and cleanup rules as generated text output.

## M1148 — Bounded identity-safe contract copying

Generated contract source/list members are no longer copied with direct `copyFile`. They are read through bounded opened-handle identity-safe source I/O as regular non-symlink files and then published through the atomic binary build writer. Generated `manifest.json` and `build-info.json` remain explicit text outputs.

## M1149 — Safe build directory lifecycle

Build directories are created one verified segment at a time with nonrecursive private directory creation and post-create real-directory checks. The generated `dist/` tree is invalidated before current build work and again after any build failure; cleanup failure is surfaced together with the original failure.

## M1150 — Generated-release integration extension

The canonical generated-release integration audit now requires every M1142–M1149 regression and the shared source/atomic-output/build-output boundaries. It preserves `canonical M1102-M1107 generated artifact boundaries are joined` and adds `extended through M1149 atomic generated build I/O boundaries`. `npm run check` remains the canonical single integration path.

## M1151 — Canonical synchronization

Synchronized `ROADMAP.md` and Issue #10 with the generated build-output I/O boundaries, finalized `docs/GENERATED_BUILD_IO_QUALIFICATION.md` as exact-head supporting evidence, reconciled the historical M1141 allocation regression so it no longer pins the current next number, added final M1151 roadmap coverage, and advanced canonical allocation to M1152. No repository audit/test/guide is a browser-pass claim; Issue #10 remains authoritative.

## Privacy and evidence boundary

These changes operate only on local repository source files, generated build files, and filesystem metadata required to create the unpacked browser candidates. They add no telemetry, analytics, browsing/request history, page/DOM snapshots, action outcomes, statistics, timestamps, user/device identifiers, language/profile state, credentials, or owned Drop Ads backend. A source, generated-member, build-output, candidate, package, or release identity change invalidates corresponding supporting evidence. Repository evidence never substitutes for real browser observation recorded through Issue #10.
