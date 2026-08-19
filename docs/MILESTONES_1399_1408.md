# Milestones 1399–1408 — Qualification observation hardening-contract integrity

This tranche continues source-only hardening of local qualification-observation tooling. It does **not** create, infer, or replace Chromium/Firefox runtime evidence. Issue #10 remains the authoritative exact-head browser qualification gate.

## M1399 — Captured hardening-contract intrinsics

The hardening source-contract parser captures Reflect/Object/String/Array inspection primitives at module load and routes string/array operations through captured `Reflect.apply`, preventing later prototype mutation from changing contract admission semantics.

## M1400 — Control/invisible/bidi-free source paths

Canonical hardening source paths now reject ASCII/DEL/C1 controls, zero-width/BOM text, and bidi embedding/override/isolate controls while retaining well-formed NFC, byte, `tools/`, slash, and dot-segment requirements.

## M1401 — Exact reviewed source order

A nine-entry reviewed path inventory binds every hardening source-contract entry to one exact source at one exact index. Canonical-looking substitutions and reorderings fail closed.

## M1402 — Immutable hardening limits authority

One frozen limits object now owns per-source bytes, path bytes, source count, aggregate bytes, and—after M1404—the privacy matcher count/label/pattern ceilings. The historical aggregate export is derived from this authority.

## M1403 — Frozen source-path projection

The canonical nine reviewed source paths are exported as one frozen ordered projection and the contract parser binds entries directly to that projection.

## M1404 — Centralized privacy matcher limits

The privacy audit consumes matcher limits only from the shared hardening limits authority: 32 matchers, 64 UTF-8 bytes per label, and 512 UTF-8 bytes per regex source.

## M1405 — Exact privacy result constructor

Privacy success is published only through an exact constructor that descriptor-validates a frozen dense canonical `{ path, bytes }` evidence array, recomputes count/aggregate, and preserves only the historical M1346/M1387/M1392/M1393 privacy markers.

## M1406 — Descriptor-safe publication inventory

The five publication-audit sources are admitted through a frozen dense own-data inventory. Every source must match the reviewed publication index and exist in the canonical M1403 hardening source-path projection; accessors, symbols, holes, reordering, and substitution fail before source reads.

## M1407 — Composed contract/privacy/publication integration

The canonical observation hardening gate verifies that the frozen limits, source paths, source contract, aggregate ceiling, and privacy matcher limits agree exactly before child/source audit work. Existing descriptor-safe privacy/publication child-result checks remain in force. The source-only integration marker is `canonical M1407 qualification observation hardening contract/privacy/publication integration verified`.

## M1408 — Closeout synchronization

This document, the M1399–M1408 regression inventory, ROADMAP history, and Issue #10 supporting-evidence comment close the tranche. No connector-created regression or audit is represented as an executed browser observation.

## Invariants preserved

- Firefox and Chromium remain one product line with exact-head qualification required for both.
- Issue #10 remains the authoritative browser-observation gate.
- Repository audits/tests/markers are source-only supporting evidence.
- No telemetry, analytics, browsing/request history, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, environment/user/host profiling, embedded credentials/tokens, or owned Drop Ads backend is introduced.
- Browser observations are never manufactured from repository state.
