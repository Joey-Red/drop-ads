# Milestones 1439–1448 — Qualification observation contract-integrity v2/privacy hardening

This tranche remains **source-only supporting evidence**. It does not manufacture, infer, or substitute for real Chromium or Firefox runtime observations. Issue #10 remains the authoritative exact-head browser qualification gate.

## M1439 — Shared contract-integrity privacy source limits

Centralized the three reviewed M1437 support-source paths and their 64 KiB per-source / 192 KiB aggregate ceilings in one immutable contract.

## M1440 — Descriptor-safe source-path projection

The three-source projection is now admitted only as an exact frozen dense array with canonical order and own data elements. Holes, accessors, symbols, extras, and reordered paths fail closed.

## M1441 — Descriptor-safe privacy matcher inventory

The M1437 forbidden-surface matchers are now admitted through an exact frozen dense tuple inventory with bounded cardinality/label/pattern text and duplicate-label rejection.

## M1442 — Captured matcher inspection/execution intrinsics

Array/Object/Reflect/Set/RegExp primitives used by matcher admission and execution are captured at module load. RegExp state is inspected through captured getters and scanning uses captured `RegExp.prototype.test`.

## M1443 — Exact privacy result constructor

Contract-integrity privacy success now publishes only through an exact frozen constructor that requires complete canonical three-source `{ path, bytes }` evidence, recomputes source count/aggregate bytes, and preserves the historical M1437 marker/result surface.

## M1444 — Exact privacy audit contract

A dedicated source-only contract audit locks the three-source limits/path projection, canonical 20-matcher inventory size, exact four-key result surface, and historical M1437 marker.

## M1445 — Contract-integrity v2 composition

A new source-only integration audit composes the historical M1435 contract-integrity result with M1444 without widening either historical result and binds the M1438 prior-closeout marker.

## M1446 — Default-check integration

The M1445 gate is wired into `npm run check` immediately after the historical contract-integrity audit and before qualification I/O auditing.

## M1447 — Privacy review of new support modules

A bounded four-source audit reviews the new M1439/M1443/M1444/M1445 support modules and refuses browser/network/storage APIs, host/environment profiling, timestamp/performance collection, subprocess/worker modules, and dynamic execution.

## M1448 — Closeout

The closeout audit composes exact M1445 contract-integrity-v2 evidence with complete M1447 privacy source evidence and publishes:

`canonical M1448 qualification observation contract-integrity v2 privacy closeout verified`

## Preserved privacy and qualification invariants

- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, or user/device identifiers.
- No environment/user/host profiling, embedded GitHub credentials/tokens, or owned Drop Ads backend behavior.
- Source audits, tests, fixtures, deterministic artifacts, and closeout markers are preflight/supporting evidence only.
- A source/head/package/qualification-record change invalidates earlier browser observations.
- Issue #10 remains the only authority for real same-exact-head Firefox + Chromium runtime qualification.
