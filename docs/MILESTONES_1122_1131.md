# Milestones 1122–1131 — Release verification and reproducibility hardening

This sequence hardens the local verification boundary after deterministic Chromium ZIP / Firefox XPI creation. Repository tests, audits, hashes, and reproducibility snapshots are preflight/supporting evidence only. Issue #10 remains the authoritative exact-head Chromium + Firefox browser qualification gate.

## M1122 — Bounded release-manifest hashing

Release-manifest creation now rejects reviewed release tools above 2 MiB and candidate archives above 64 MiB before hashing begins. The same ceilings are enforced when validating recorded descriptor byte counts. Opened-handle identity checks, streaming SHA-256, and post-hash size/mtime/ctime revalidation remain required.

## M1123 — Exact candidate request paths

Release-manifest creation accepts only the versioned candidate paths derived from the validated package identity: `dist/<name>-<version>-chromium.zip` and `dist/<name>-<version>-firefox.xpi`. Alternate `dist/` paths are rejected before a candidate is opened or hashed.

## M1124 — Canonical release package identity

Added `tools/release-package-identity.mjs` as the single package name/version grammar used by direct packaging, release verification, and release-manifest request/record validation. Names are at most 128 characters, versions are at most 64 characters, and both use only ASCII `[A-Za-z0-9._@+-]+`. The helper is part of release-tool provenance.

## M1125 — Direct verification provenance preflight

`verifyRelease(root)` now invokes `auditReleaseToolContract(root)` before package metadata, build identity, generated output, release-manifest, or candidate inspection. Direct `npm run verify:release` therefore cannot bypass the canonical release-tool provenance contract.

## M1126 — Bounded reproducibility snapshots

Reproducibility snapshots are bounded to 4,096 files, 4,096 directories, 64 MiB per file, 256 MiB aggregate bytes, and 1,024 UTF-8 bytes per repository-relative path. Oversized files are rejected before opening/hashing and retain opened-handle identity/snapshot revalidation.

## M1127 — Exact `dist/` topology

Before recursive reproducibility hashing, the top-level `dist/` set must be exactly the real `chromium/` and `firefox/` directories plus `release-manifest.json` and the two exact versioned candidate archives. Missing, extra, symlinked, or wrong-type top-level entries fail closed.

## M1128 — Sanitized reproducibility child environment

The two reproducibility build/package passes use a frozen null-prototype string-only environment snapshot. Node execution/module/runtime configuration variables `NODE_OPTIONS`, `NODE_PATH`, `NODE_REPL_EXTERNAL_MODULE`, and `NODE_ICU_DATA` are stripped while ordinary platform environment required for cross-platform execution remains available.

## M1129 — Extended archive/release integration gate

The existing `archive-release-integration-audit` now joins M1122–M1128 with the earlier archive/provenance sequence. It preserves the compatibility marker `canonical M1112-M1118 archive release boundaries are joined` and adds `extended through M1128 release verification and reproducibility boundaries`. The audit remains wired exactly once in canonical `npm run check`.

## M1130 — Exact-head verification/reproducibility guidance

Added `docs/RELEASE_REPRODUCIBILITY_QUALIFICATION.md` for local verification of the exact candidate release before real browser observation. It documents what `verify:release` and `verify:reproducible` prove, what invalidates a candidate, and what they explicitly do not prove.

## M1131 — Canonical synchronization

Synchronized the canonical roadmap and Issue #10 release gate with the M1122–M1130 verification/reproducibility boundaries, added the exact-head qualification delta without claiming browser validation, reconciled historical next-number regression coverage, and advanced canonical allocation to M1132. `docs/RELEASE_REPRODUCIBILITY_QUALIFICATION.md` remains supporting local evidence only; Issue #10 remains the browser-observation authority.

## Privacy and evidence boundary

These tools inspect only local repository/build/package files and process environment needed to run local verification. They do not collect telemetry, analytics, browsing/request history, URLs visited by the user, page/DOM snapshots, action outcomes, statistics, timestamps, identifiers, credentials, or language/profile state, and they do not require an owned Drop Ads backend. A source commit, release-tool provenance change, package identity change, generated-member change, release-manifest change, candidate hash/size/structure change, reproducibility topology change, or other exact-candidate mismatch invalidates prior supporting evidence. Repository evidence never substitutes for real browser observation recorded through Issue #10.
