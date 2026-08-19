# Milestones M1172–M1181 — Deterministic build-input identity hardening

This sequence strengthens the source-fingerprint boundary without collecting user data or converting repository evidence into browser evidence. The repository tests, audits, fingerprints, and filesystem checks described here are **supporting/preflight evidence only**. They do not constitute Chromium or Firefox qualification; Issue #10 remains the authoritative exact-head real-browser gate.

## M1172 — Locale-independent build-input ordering

Build-input directory entries, collected canonical paths, and fingerprint descriptors use one direct ECMAScript code-unit comparator. `localeCompare` is excluded from build-input identity so fingerprints do not vary with host locale/collation configuration.

## M1173 — Portable Unicode provenance paths

Canonical repository-relative build-input paths must be well-formed Unicode, already NFC-normalized, and free of control text including U+2028/U+2029. The existing relative forward-slash, no-dot-segment, canonical-normalization, and 1,024 UTF-8 byte limits remain fail-closed.

## M1174 — Descriptor-safe per-file byte identity

Build-info descriptor snapshotting moved to fingerprinted `tools/build-input-descriptor-safety.mjs`. Every recorded source descriptor must be canonical and may describe at most 16 MiB, matching the real opened-handle hashing ceiling.

## M1175 — Descriptor aggregate byte identity

A validated build-info descriptor set may describe at most 256 MiB total source bytes. The first byte beyond that aggregate ceiling fails closed even when the supplied hashes are otherwise self-consistent.

## M1176 — Linear dense-array validation

The up-to-100,000-entry descriptor boundary snapshots own keys once into a `Set`, preserving exact dense-array/extra-field/hole rejection without repeated linear `includes` scans.

## M1177 — Shared root traversal budget and pre-hash admission

`src`, `lists`, and `manifests` now share one discovery state: at most 100,000 visited entries and 4,096 visited directories total, with at most 8,192 entries materialized from one directory. Discovered plus fixed build inputs are capped at 100,000 descriptors and duplicate canonical paths are rejected before file hashing begins.

## M1178 — Package metadata pathname identity

The bounded strict-UTF-8 `package.json` reader revalidates the pathname after opened-handle reading. File identity and size/time snapshot must still match before package metadata can influence build identity.

## M1179 — Shared build/release package identity

Build-info package name/version validation now uses `snapshotReleasePackageIdentity`, the same bounded ASCII release grammar used by packaging and verification. `tools/release-package-identity.mjs` is itself a fingerprinted build semantic input, preventing a package-identity rule change from silently leaving the source fingerprint unchanged.

## M1180 — Canonical audit extension

The dedicated build-input audit and existing build/release integration gate protect the M1172–M1179 boundaries while retaining historical compatibility markers. The dedicated audit adds `extended through M1179 deterministic build input boundaries`, and the integration audit retains M1169 while adding the same M1179 extension marker.

## M1181 — Canonical synchronization

Documentation, exact-head supporting-evidence guidance, ROADMAP release-gate language, historical next-number coverage, and Issue #10 are synchronized with M1172–M1180. Canonical milestone allocation advances to M1182.

## Privacy and qualification boundary

These changes inspect only local source bytes, canonical repository-relative paths, hashes, package identity text, and filesystem metadata needed transiently to construct or validate build identity. They do not retain telemetry, analytics, browsing/request history, page or DOM snapshots, action outcomes, accessibility names, consent data, locale/language profiles, statistics, timestamps, user/device identifiers, credentials, or owned Drop Ads backend state.

Connector-created tests and audits in this sequence were not executed locally or in browsers, and no browser pass is claimed. Any source commit or build-input/package-identity boundary change requires generation and qualification of the new exact head through Issue #10 rather than carrying prior Chromium/Firefox observations forward.
