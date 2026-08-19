# Milestones 1112–1121 — Release archive and provenance integrity

This sequence hardens the boundary between reviewed generated extension trees and the exact Chromium ZIP / Firefox XPI candidates used for qualification. Repository tests and audits are preflight/supporting evidence only. Issue #10 remains the authoritative exact-head Chromium + Firefox browser qualification gate.

## M1112 — Bounded atomic release-output primitive

Added `tools/release-output-io.mjs`, a standalone local helper for bounded, stage-relative, canonical text output using real-directory checks, exclusive temporary files, fsync, atomic rename, and failure cleanup. Current package manifest persistence remains on the existing `release-manifest-io` path; this helper is a reviewed release-output primitive, not a browser observation service.

## M1113 — Canonical release-tool provenance

Added `tools/release-tool-contract.mjs` and bound `tools/release-manifest.mjs` to its immutable release-tool path set while retaining the compatibility `PACKAGING_TOOL_PATHS` export. Release manifests therefore hash the reviewed tools that define package/archive/release verification instead of a stale partial list.

## M1114 — Release-tool provenance audit

Added `tools/release-tool-contract-audit.mjs`. Contract entries must be unique normalized repository-local `tools/*.mjs` paths and regular non-symlink files, required release roots must remain represented, and `release-manifest.mjs` must consume the canonical contract.

## M1115 — Direct-package provenance preflight

`tools/package.mjs` now runs the release-tool contract audit before package metadata reads, build identity verification, archive creation, or release-manifest generation. Versioned Chromium `.zip` and Firefox `.xpi` naming remains unchanged.

## M1116 — Bounded archive reads

`tools/zip-verify.mjs` now checks candidate archive identity and the 64 MiB candidate ceiling before allocating the archive buffer, then reads through an opened file handle and revalidates the file after the read. Verification also has explicit entry-count, per-entry, path, and aggregate-uncompressed ceilings.

## M1117 — Complete deterministic ZIP header contract

Archive verification now requires the exact classic-ZIP metadata emitted by the deterministic writer: version-made-by/version-needed 20, UTF-8 stored entries, zero timestamps, zero disk/extra/comment/internal/external attribute fields, matching local header fields, strictly ascending names, contiguous local offsets, CRC agreement, and no hidden/unreferenced bytes.

## M1118 — Identity-safe package member reads

Added `tools/package-source-io.mjs`. Deterministic ZIP creation and ZIP-vs-generated-tree verification read members through bounded opened-handle identity checks rather than lstat followed by an unrelated pathname read. Generated-tree traversal also rejects symlinks and non-regular entries. The helper and package output writer are included in release provenance.

## M1119 — Canonical archive release preflight

Added `tools/archive-release-integration-audit.mjs`, joining M1112–M1118 boundaries and regressions. `release-tool-contract-audit` and `archive-release-integration-audit` are independently callable package scripts and run exactly once in canonical `npm run check` after generated-release integration and before source-text auditing. The integration marker is `canonical M1112-M1118 archive release boundaries are joined`.

## M1120 — Exact-head archive qualification guidance

Added `docs/ARCHIVE_RELEASE_QUALIFICATION.md` for candidate-package inspection and exact-head browser qualification without converting repository checks into Chromium/Firefox evidence.

## M1121 — Canonical synchronization

Synchronized `ROADMAP.md`, the Issue #10 release gate, exact-head archive qualification requirements, and historical allocation regressions; advanced canonical allocation to M1122. The release gate now explicitly binds candidate archives to the exact canonical release-tool provenance set, strict bounded/deterministic archive verification, identity-safe generated-member comparison, and the M1119 integration marker. Issue #10 received the matching qualification delta without any browser-pass claim.

## Privacy and evidence boundary

These tools inspect local repository/build/package files. They do not collect telemetry, analytics, browsing/request history, page or DOM snapshots, action outcomes, accessibility names, statistics, timestamps, identifiers, credentials, or language/profile state, and they do not require an owned Drop Ads backend. A source commit, release-tool change, generated-tree change, package hash change, or release-manifest mismatch invalidates the exact candidate; repository evidence never substitutes for real browser observation.
