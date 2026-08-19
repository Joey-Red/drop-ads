# Milestones 599–608 — Bounded qualification data and I/O hardening

This block hardens the local qualification tooling around untrusted or malformed artifact objects/files. It does **not** record a Chromium or Firefox observation and does not satisfy Issue #10 by itself.

## M599 — Descriptor-safe qualification observation cloning

The guarded observation editor no longer clones loaded observation data with `JSON.stringify`/`JSON.parse`. Observation data is copied through bounded descriptor-only inspection, rejecting accessors, symbols, unsupported prototypes/values, inspection traps, excessive depth, and excessive node count before mutation.

## M600 — Snapshot guarded qualification update commands

Direct observation-update command objects are snapshotted through exact descriptor-only field inspection before mutation. Browser/scenario commands require the same bounded browser/status/text/replacement semantics as CLI parsing and reject extra fields, accessors, symbols, custom prototypes, and inspection traps.

## M601 — Centralize safe qualification JSON serialization

`tools/qualification-json-data.mjs` is the shared bounded plain-data clone/serialization boundary. Guarded observation cloning and atomic observation writes use it so getters, `toJSON`, symbols, custom prototypes, traps, or unsupported values cannot influence persisted JSON.

## M602 — Bound qualification artifact reads

`tools/qualification-file-io.mjs` adds regular-file, strict-UTF-8, explicit-byte-ceiling reads through an opened file handle. The guarded observation editor uses these limits before JSON parsing:

- `package.json`: 256 KiB
- `artifacts/qualification-record.json`: 256 KiB
- `artifacts/qualification-observation.json`: 1 MiB

The reader detects file growth beyond the ceiling during the read rather than relying only on an initial size check.

## M603 — Bound qualification status and next-step reads

`qualify:status` and `qualify:next` now use the same bounded strict-UTF-8 file boundary for package, qualification-record, and observation artifacts. Their schema-v3, exact-head, privacy-minimal output semantics are unchanged.

## M604 — Bound qualification observation audit reads

The authoritative observation-record audit CLI uses the bounded file boundary as well. The reusable validator can still diagnose legacy v2 structure, but the active audit continues to require schema v3 before qualification use.

## M605 — Harden schema-v3 observation seed preparation

Observation preparation/reset uses bounded reads for package, record, and any existing observation output. After schema-v4 record validation, candidate identity is copied from a descriptor-safe clone rather than directly from the caller object, preventing proxy/getter behavior between validation and seed construction. Identical-seed comparison also uses sanitized deterministic JSON data.

The bounded reader now has an explicit optional-missing mode for the observation output path; absence can be represented as `null` without weakening the non-empty requirement for normal qualification artifact reads.

## M606 — Bound qualification record audit inputs

`qualification-record-audit` now bounds both repository-relative file input and stdin input. The record audit preserves repository path containment and the schema-v4 privacy-minimal validator while rejecting empty, oversized, non-regular, or malformed UTF-8 input before JSON parsing.

## M607 — Bound atomic observation conflict checks

The atomic observation writer's compare-before-replace read now uses the bounded strict-UTF-8 observation boundary. Caller-provided expected-current snapshots and serialized candidate observations are capped at the 1 MiB observation ceiling before persistence. Exclusive temporary creation, conflict detection, cleanup, and final rename remain unchanged.

## M608 — Enforce and document bounded qualification I/O

`tools/qualification-io-audit.mjs` is part of `npm run check`. It protects the active qualification artifact readers/writer, the strict byte ceilings, regular-file/UTF-8 boundary, bounded stdin path, descriptor-safe JSON sanitizer, guarded update snapshot, seed record snapshot, and atomic conflict-check path from silent regression.

## Evidence boundary

Repository/connector-created tests and audits in this block are preflight artifacts unless they are actually executed. No local `npm run check`, package qualification, Chromium observation, Firefox observation, or release qualification is claimed by the connector work recorded here.

Issue #10 remains the authoritative real Firefox + Chromium runtime qualification gate against the exact current `main` commit and exact generated package hashes. Any source commit after a browser observation invalidates that observation for the new head.

The privacy invariants remain unchanged: no telemetry, analytics, browsing/request history, matched-element/DOM history, retained statistics database, user/device identifiers, or owned Drop Ads tracking backend.
