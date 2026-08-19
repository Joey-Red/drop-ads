# Milestones 1369–1378 — Qualification observation preparation/read integrity

This tranche hardens the local source-only qualification-observation preparation and shared read boundaries. It does **not** create, infer, or replace Chromium/Firefox runtime observations. Issue #10 remains the authoritative exact-head browser qualification gate.

## M1369 — Root-bound observation preparation

`prepareQualificationObservation` now supplies the resolved repository root to the canonical atomic observation writer. Seed and explicit-replace publication therefore cannot bypass canonical `artifacts/qualification-observation.json` confinement, repository/artifacts/target identity checks, temporary-file integrity, or final publication verification.

## M1370 — Descriptor-safe preparation options

Preparation accepts one exact frozen options snapshot. Only optional boolean `replace` is admitted as an enumerable own data field on an ordinary or null-prototype object. Accessors, symbols, extras, arrays, custom prototypes, and non-booleans fail closed without getter execution.

## M1371 — Repository-root-bound lock lifecycle

Observation locking now snapshots the real non-symlink repository root before artifacts/lock work and revalidates the same device/inode identity after lock creation and before cleanup. A root replacement cannot redirect cleanup to an untrusted replacement path.

## M1372 — Descriptor-safe shared read options

Shared qualification file and stream readers no longer destructure caller-owned option objects. File reads admit only `maxBytes`, `label`, `allowEmpty`, and `allowMissing`; stream reads admit only `maxBytes`, `label`, and `allowEmpty`. Options are descriptor-snapshotted and primitive-validated before I/O or stream inspection.

## M1373 — Descriptor-safe pathname identity contracts

Path-admission options and pathname identity snapshots are exact own-data contracts. Revalidation consumes canonical `{ path, missing[, identity] }` data with exact device/inode/size/mtime/ctime identity rather than live caller properties. Missing-file semantics remain explicit and fail closed on appearance/replacement.

## M1374 — Captured async-stream iteration

`readQualificationUtf8Stream` resolves `Symbol.asyncIterator`, `next`, and optional `return` through a bounded descriptor-only prototype walk, captures the data functions once, calls them with exact receivers, and descriptor-snapshots iterator results before accepting bytes. Accessor-backed iteration is refused without getter execution; bounded-read failure attempts captured iterator cleanup while retaining the original error.

## M1375 — Final exact-head preparation validation

Observation preparation now validates the current checkout before candidate work and again immediately before seed/replace publication. A source/head change during preparation therefore fails closed rather than publishing stale qualification identity.

## M1376 — Hardening/privacy inventory reconciliation

The exact bounded observation-hardening/privacy inventory now includes `qualification-observation-prepare.mjs` and contains nine reviewed sources at 256 KiB each. Canonical hardening/publication audits were reconciled to current root-lock, read/path-option, stream-iteration, and preparation semantics while preserving historical markers.

## M1377 — Composed preparation/publication integrity

The publication-integrity audit now reviews preparation directly and verifies descriptor-safe options, canonical output construction, lock ordering, initial/final exact-head validation, existing-observation conflict reading, and root-bound atomic writer ordering. It emits `canonical M1377 qualification observation prepare/publication integrity verified`, surfaced by the canonical observation hardening gate.

## M1378 — Closeout synchronization

This milestone synchronizes the tranche documentation, closeout regression, hardening marker, roadmap history, and Issue #10 supporting-evidence note. The canonical closeout marker is:

`canonical M1378 qualification observation preparation/read integrity closeout verified`

## Locked invariants

- Source-only audits, markers, tests, fixtures, generated records, and deterministic packages are supporting evidence only; they are never browser observations.
- Issue #10 remains authoritative for real exact-head Chromium + Firefox qualification.
- Observation preparation and updates publish only to the canonical repository-local observation artifact when repository binding is active.
- Repository root, artifacts directory, target, temporary file, and lock identities remain fail-closed across publication/cleanup boundaries.
- Shared file reads remain bounded, strict UTF-8, regular non-symlink, and pathname/handle identity-safe.
- Shared stream reads remain bounded and consume only captured descriptor-safe async-iteration collaborators.
- Preparation validates exact-head identity again immediately before persistence.
- The reviewed qualification-observation boundary retains zero telemetry/tracking, browsing/request history, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, embedded credentials/tokens, and owned Drop Ads backend behavior.

Connector-created tests and audits in this tranche were added as source-only regression evidence and are not represented here as locally executed or browser-executed results.
