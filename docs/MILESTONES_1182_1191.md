# Milestones 1182–1191 — Build-input repository-root and ancestry hardening

This sequence hardens the local build-input/source-fingerprint boundary. It is supporting/preflight evidence only; Issue #10 remains authoritative for real exact-head Chromium + Firefox runtime qualification.

## M1182 — Descriptor-safe root requests
Multi-root discovery snapshots caller root requests through bounded own keys/descriptors. Dense arrays only; holes, extra fields, accessors, and non-string entries fail closed before filesystem traversal.

## M1183 — Canonical unique root requests
Requested build roots must be absolute normalized platform paths. Duplicate roots are rejected before they can consume traversal budget twice.

## M1184 — Repository-root discovery identity
Single- and multi-root discovery require a real non-symlink repository root and revalidate its filesystem identity/size/time after traversal.

## M1185 — Cross-phase build-info root identity
Build-info creation binds the package-metadata read and subsequent build-input collection to one repository-root identity snapshot, failing closed on root replacement or mutation.

## M1186 — Immutable membership contract
Recursive roots and fixed inputs are immutable, bounded, canonical, unique, and non-overlapping. Recursive roots are single path segments; fixed members cannot duplicate content already covered by recursive roots.

## M1187 — Real bounded input ancestry
`tools/build-input-ancestry.mjs` requires the repository root and every parent directory of an admitted input to be real non-symlink directories within a 64-directory ancestry ceiling. The helper is itself a fingerprinted build semantic input.

## M1188 — Post-hash ancestry revalidation
Frozen ancestry snapshots are structurally validated and every directory is re-lstat'd after hashing. Size/time and available device/inode identity must remain unchanged before a descriptor is admitted.

## M1189 — Bounded incremental fingerprint serialization
Canonical sorted descriptor JSON is SHA-256 hashed incrementally using the exact ordinary JSON byte stream while enforcing an 8 MiB UTF-8 ceiling. Whole-array JSON Buffer allocation is no longer required.

## M1190 — Canonical audit extension
The dedicated build-input audit and existing build/release integration gate protect M1182–M1189 while retaining the historical M1162–M1168, M1169, and M1179 markers. The new audit marker is `extended through M1189 repository-root and ancestry boundaries verified`.

## M1191 — Canonical synchronization
This record, `docs/BUILD_INPUT_QUALIFICATION.md`, `ROADMAP.md`, and Issue #10 are synchronized. Canonical milestone allocation advances to M1192.

## Privacy and qualification boundary
No milestone adds telemetry, analytics, browsing/request history, retained source observations, timestamps, identifiers, credentials, or an owned Drop Ads backend. Filesystem paths/metadata and local source bytes are inspected only transiently for build integrity. Connector-created tests and audits in this sequence were not executed locally or in browsers, and repository evidence never substitutes for exact-head Chromium + Firefox observation.
