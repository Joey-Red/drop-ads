# Milestones 629–638 — Package pipeline hardening

Completed post-merge build/package/reproducibility hardening on `main`.

## Milestone 629 — Atomic build metadata output

Generated Chromium/Firefox `manifest.json` and `build-info.json` writes now go through a `dist/`-contained writer using a same-directory exclusive `0600` temporary file, fsync, and atomic rename. Symlink/non-directory destination parents fail closed.

## Milestone 630 — Bounded build manifest reads

Build manifest JSON is read only from regular non-symlink files through bounded incremental reads, strict UTF-8 decoding, mutation checks, and a 256 KiB default ceiling before JSON parsing.

## Milestone 631 — ZIP source-tree safety

Deterministic ZIP traversal requires a real source directory and re-checks directories/files with `lstat`; symbolic links and special filesystem entries are rejected before package reads.

## Milestone 632 — ZIP resource ceilings

Stored ZIP creation now bounds entry count, UTF-8 entry-name bytes, per-entry bytes, total uncompressed bytes, local offsets, and classic-ZIP final size before fixed-width header writes or large concatenations.

## Milestone 633 — Descriptor-safe ZIP entries

Direct `createStoredZipBuffer()` callers are snapshotted through dense descriptor-only arrays and exact plain `{name,data}` objects. Accessors, extra/symbol fields, sparse arrays, custom prototypes, traps, and unsupported payloads fail closed. Accepted byte payloads are copied before encoding.

## Milestone 634 — Atomic package output

ZIP/XPI output now uses a bounded binary writer with a real destination parent, exclusive same-directory `0600` temporary file, fsync, atomic rename, and cleanup on failure.

## Milestone 635 — Bounded release verification metadata

`verify:release` reads `package.json`, Chromium/Firefox `build-info.json`, and `release-manifest.json` through bounded strict-UTF-8 regular-file JSON reads. Build-info and release-manifest data are schema-validated before identity comparisons.

## Milestone 636 — Bounded package-time metadata

`tools/package.mjs` uses the same bounded JSON boundary for package/build-info metadata, validates browser build-info before comparison, and validates package name/version before archive-name and release-manifest derivation.

## Milestone 637 — Streamed reproducibility snapshots

Same-source reproducibility snapshots now stream generated/package files through opened handles and SHA-256 while checking regular-file identity, size, and metadata stability across EOF. Symlinks, growth, shrinkage, or mutation fail closed.

## Milestone 638 — Enforced package-pipeline gate

`tools/package-pipeline-hardening-audit.mjs` statically protects the active M629–M637 boundaries and is wired into `npm run check`.

## Evidence boundary

These changes and regression tests were created through the repository connector in this continuation. They were not executed locally, packaged, or exercised in Chromium/Firefox here. They are repository-level preflight coverage only.

Issue #10 remains the authoritative real-browser Chromium + Firefox qualification gate. Any later source change still invalidates prior browser observations for an older exact candidate.

The block preserves the project invariants: no telemetry, analytics, browsing/request history, retained statistics, user/device identifiers, or owned Drop Ads backend were introduced.
