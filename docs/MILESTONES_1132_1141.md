# Milestones 1132–1141 — Atomic release-output and archive-writer hardening

This sequence hardens local release publication and deterministic archive creation after the M1122–M1131 release-verification/reproducibility boundary. Repository tests, audits, hashes, generated files, and archive checks remain preflight/supporting evidence only. Issue #10 remains the authoritative exact-head Chromium + Firefox browser qualification gate.

## M1132 — Canonical release-manifest atomic output

`writeReleaseManifestAtomic` now serializes within the existing 256 KiB ceiling and delegates persistence to the canonical bounded atomic release-text writer. Release-manifest output therefore shares the same stage-relative containment, real-parent, exclusive temporary file, fsync, atomic rename, and cleanup boundary rather than maintaining a second output implementation.

## M1133 — Cryptographic temporary names

Release text and package binary atomic writers now share `tools/atomic-output-temp.mjs`. Temporary names stay in the destination parent and use 128 bits of cryptographic randomness from `randomBytes(16)` rather than `Math.random`, while retaining exclusive `wx` creation and mode `0600`. The helper is part of canonical release-tool provenance.

## M1134 — Parent identity revalidation

Atomic output writers snapshot the real destination parent directory and revalidate device/inode identity immediately before publish. Parent replacement, symlink substitution, or non-directory state fails closed before rename.

## M1135 — Published output verification

After atomic rename, both release-text and package-binary writers lstat the final path and require a regular non-symlink file with exactly the expected byte size before returning success.

## M1136 — Failed package-set invalidation

Direct packaging invalidates the exact current Chromium ZIP, Firefox XPI, and `release-manifest.json` before archive creation. Any package, manifest, or final release-verification failure invalidates those exact outputs again; cleanup failure is surfaced rather than leaving a plausibly valid mixed release set. Generated browser directories are not removed.

## M1137 — Shared release archive contract

Deterministic ZIP creation and ZIP verification now consume one immutable archive resource contract: at most 1,024 entries, 64 MiB archive bytes, 16 MiB per entry, 512 UTF-8 bytes per archive path, and 64 MiB aggregate uncompressed bytes. Existing `ZIP_LIMITS`/`ZIP_VERIFY_LIMITS` names remain compatibility surfaces, and the shared contract is release-tool provenance.

## M1138 — Final archive byte ceiling

The ZIP writer computes the complete local-data + central-directory + EOCD byte count before the final combined Buffer allocation. Unsafe/classic-ZIP overflow and archives above 64 MiB fail before final allocation, and the atomic package writer receives the same 64 MiB ceiling.

## M1139 — Bounded source traversal

Deterministic archive source discovery is bounded to 4,096 directories and 1,024 UTF-8 bytes per source-relative path. It uses bounded `opendir` iteration, caps total discovered filesystem entries to the reviewed file+directory budget, preserves deterministic sorting, and continues to reject symlink/non-regular inputs before file reads.

## M1140 — Extended archive/release integration gate

The existing `archive-release-integration-audit` now joins M1132–M1139 with the earlier release archive/provenance and verification/reproducibility boundaries. It preserves `canonical M1112-M1118 archive release boundaries are joined` and `extended through M1128 release verification and reproducibility boundaries`, and adds `extended through M1139 atomic output and archive writer boundaries`.

## M1141 — Canonical synchronization

Synchronized the canonical roadmap and Issue #10 release gate with the M1132–M1140 atomic-output/archive-writer boundaries, added `docs/RELEASE_OUTPUT_ARCHIVE_QUALIFICATION.md` for exact-head supporting evidence, reconciled the historical M1131 next-number regression, posted the new qualification delta without claiming browser validation, and advanced canonical allocation to M1142. Issue #10 remains the browser-observation authority.

## Privacy and evidence boundary

These changes operate only on local repository/build/release files and filesystem metadata required for deterministic package creation. They add no telemetry, analytics, browsing/request history, page/DOM snapshots, action outcomes, statistics, timestamps, identifiers, language/profile state, credentials, or owned Drop Ads backend. A source, release-tool, archive-contract, generated-member, output, candidate, or release-manifest change invalidates the corresponding supporting evidence. Repository evidence never substitutes for real Chromium + Firefox observation recorded through Issue #10.
