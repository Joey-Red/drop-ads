# Milestones 619–628 — Build and release metadata hardening

This block hardens the local build fingerprint and release-manifest pipeline used before Issue #10 browser qualification. It adds no telemetry, browsing/request history, retained statistics, identifiers, or owned backend, and it does not claim that Chromium or Firefox were opened or tested.

## M619 — Fail closed on unsafe build-input tree entries

Build input traversal now rejects symlinks and unsupported filesystem entry types instead of silently skipping them. Canonical input roots must be real directories, and each hashed build input is rechecked as a regular non-symlink file before reading.

## M620 — Stream and stabilize build-input hashing

Build inputs are SHA-256 hashed incrementally through opened file handles rather than being loaded wholly into memory. Pre-open/open identity, byte count, and post-read metadata checks reject growth, shrinkage, replacement, or mutation while hashing.

## M621 — Snapshot build-fingerprint descriptors safely

`fingerprintBuildInputs()` snapshots dense `{ path, bytes, sha256 }` input descriptors through data-property inspection. Accessors, symbols, extra fields, holes, custom prototypes, inspection traps, duplicate paths, traversal paths, malformed hashes, and invalid byte counts fail closed before canonicalization.

## M622 — Bound and validate build-info metadata

`package.json` used by build-info generation is a regular-file strict-UTF-8 input capped at 256 KiB. Build-info schema validation requires exact package/fingerprint/input fields and verifies that the stored source fingerprint matches the sanitized canonical input set. Serialized build-info output is validated and capped at 8 MiB.

## M623 — Contain release-manifest file paths

Release artifact requests must use normalized repository-relative paths contained inside the checkout and under `dist/`. Package artifacts and fixed packaging tools must be regular non-symlink files before hashing.

## M624 — Stream release-manifest hashing

Release artifacts and packaging tools are SHA-256 hashed incrementally through opened file handles. Growth, shrinkage, symlink inputs, identity changes, and metadata mutation fail closed before byte/hash descriptors are accepted.

## M625 — Snapshot release-manifest construction inputs

`createReleaseManifest()` no longer destructures arbitrary caller objects. Descriptor-only request snapshots require the exact request fields plus a dense two-artifact set containing exactly one Chromium and one Firefox package descriptor.

## M626 — Validate and sanitize release-manifest output

Release-manifest schema validation requires the exact canonical packaging-tool set, one Chromium ZIP, one Firefox XPI, positive safe byte counts, lowercase SHA-256 values, and package-bound artifact filenames. Serialization accepts only validated normalized data and is capped at 256 KiB.

## M627 — Atomically persist release manifests

`tools/package.mjs` no longer writes `dist/release-manifest.json` directly. A dedicated writer validates/serializes the manifest, requires a real non-symlink parent directory, writes a same-directory exclusive `0600` temporary file, and atomically renames it into place with cleanup on failure.

## M628 — Enforce build and release metadata hardening

`tools/build-release-hardening-audit.mjs` statically protects the M619–M627 boundaries and is wired into `npm run check`. Current-state documentation and Issue #10 guidance are synchronized with this block.

## Evidence boundary

All implementation, tests, audits, and documentation in M619–M628 were created through the GitHub connector in this continuation. They were **not executed locally**, and no real Chromium/Firefox browser matrix was performed here. Issue #10 remains the authoritative real-browser release gate for the exact candidate head. Any later source commit changes the candidate and requires fresh preflight/browser qualification for that new head.
