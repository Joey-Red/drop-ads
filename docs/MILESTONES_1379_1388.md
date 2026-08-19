# Milestones 1379–1388 — Qualification observation identity/JSON/privacy integrity hardening

This tranche hardens local qualification-observation persistence and its source-only audit support. It does **not** manufacture or infer Chromium/Firefox runtime observations. Issue #10 remains the authoritative exact-head browser qualification gate.

## M1379 — Descriptor-safe observation filesystem snapshots

Repository-root, artifacts-directory, target, temporary, and regular-file identity revalidation consumes exact frozen plain own-data snapshots. Accessors, symbols, extras, custom prototypes, mutable snapshots, and malformed identity fields fail closed before filesystem comparison.

## M1380 — Canonical observation path and target-option admission

Repository/output/temporary/target path helpers require canonical absolute paths. Target snapshot options are descriptor-snapshotted and admit only optional boolean `allowMissing`; alias paths and accessor-backed/extra option fields are refused before filesystem work.

## M1381 — Exact fsynced temporary-file publication identity

Atomic publication passes the fsynced temporary file's frozen identity into final target verification. Success requires the renamed target to be that exact regular file, not merely a same-sized replacement.

## M1382 — Descriptor-safe observation lock identity

Lock paths require canonical absolute roots. Lock state is an exact frozen `{ path, identity }` contract and revalidation consumes only descriptor-safe own data before lock cleanup decisions.

## M1383 — Stronger filesystem identity tuples

Repository/artifacts/lock identities bind `dev`, `ino`, `mode`, and `nlink`. Regular target/temporary/final-publication identities additionally bind `size`, `mtimeMs`, and `ctimeMs`. Permission/type-bit or hard-link-count drift therefore fails closed.

## M1384 — Bounded qualification JSON keys and scalar text

Shared qualification JSON cloning refuses objects above 128 own fields, field names above 256 UTF-8 bytes, and scalar strings above 256 KiB before recursive clone/stringify allocation. Existing depth/node limits and descriptor-safe field admission remain active.

## M1385 — Frozen canonical qualification JSON snapshots

Every cloned qualification JSON object is a recursively frozen null-prototype snapshot. Callers cannot mutate validated clone state between admission and observation seed/publication use; canonical pretty-JSON bytes remain compatible.

## M1386 — Identity/JSON hardening gate reconciliation

The composed publication audit now locks descriptor-safe path/target/lock contracts, canonical paths, stronger identity tuples, and exact fsynced-temp final identity. The canonical hardening gate additionally locks the bounded/frozen qualification JSON contract. Historical M1357/M1367/M1377 and M1344/M1347/M1356/M1366/M1376/M1378 markers remain preserved.

Markers:

- `canonical M1386 qualification observation publication identity hardening reconciled`
- `canonical M1386 qualification observation identity/JSON hardening reconciled`

## M1387 — Immutable stateless privacy matcher execution

The observation privacy-surface audit compiles its forbidden-surface rules from a frozen exact tuple inventory capped at 32 entries, 64 UTF-8 label bytes, and 512 UTF-8 pattern bytes. Duplicate/malformed/stateful definitions fail closed. Matching uses captured `RegExp.prototype.test` via captured `Reflect.apply`, not live `.test` property lookup.

Markers:

- historical `canonical M1346 qualification observation privacy surface verified`
- `canonical M1387 qualification observation privacy matcher integrity verified`

## M1388 — Closeout synchronization

This document, the canonical observation hardening gate, closeout regression, ROADMAP history/next pointer, and Issue #10 supporting-evidence note are synchronized. The closeout marker is:

`canonical M1388 qualification observation identity/JSON/privacy integrity closeout verified`

## Locked tranche invariants

- All work in M1379–M1388 is repository/source supporting evidence only.
- Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate.
- No source-only audit marker, unit regression, fixture, package, hash, or deterministic result may be interpreted as a browser observation.
- Normal operation requires no owned Drop Ads backend.
- Zero telemetry/tracking remains absolute: no browsing/request history, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, environment/user/host profiling, or embedded GitHub credentials/tokens.
- Qualification evidence remains local, bounded, canonical, identity-bound, and fail-closed under malformed input or filesystem drift.
