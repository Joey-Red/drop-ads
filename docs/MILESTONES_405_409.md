# Milestones 405–409 — Runtime collaborator boundary hardening

This block tightens remaining background-runtime collaborator and comparison boundaries without changing Drop Ads privacy, permissions, retention, precedence, or recovery semantics.

## Milestone 405 — Bound runtime cache fingerprint canonicalization

Runtime list-cache equality no longer routes through the older recursive `canonicalValue()` helper. `cacheFingerprint()` now uses the reviewed descriptor-only bounded JSON snapshot machinery with explicit limits of depth **32**, **512 fields per object**, **300,000 array entries**, and **1,000,000 visited values**.

The boundary accepts only null/string/boolean/finite-number scalars, ordinary/null-prototype data objects, and normal dense data arrays. Cycles, accessors, symbols, custom prototypes, sparse/extra arrays, revoked proxies, unsupported values, non-finite numbers, and work overflow fail closed rather than being truncated or traversed through normal property reads. Deterministic object-key ordering and valid-cache equality semantics remain unchanged.

Coverage: `tests/runtime-cache-fingerprint-v405.test.js`.

## Milestone 406 — Capture mandatory/core background disposers exactly once

Background bootstrap now applies the same captured-disposer model used by optional features to mandatory recovery and the core runtime layer. If a registration exposes `dispose`, it must be an own enumerable data function. The callback is captured once immediately after installation and bound to the original registration receiver.

Teardown no longer re-reads a mutable or accessor-backed `registration.dispose`. Unsafe registration metadata fails startup rather than leaving a partially reviewable teardown contract. Reverse optional teardown remains first, followed by mandatory recovery and then a distinct core layer; teardown failures remain independently isolated.

Coverage: `tests/background-bootstrap-layer-disposer-v406.test.js`.

## Milestone 407 — Contain tab fanout synchronous send failures

`sendTabMessageBatched()` now captures/binds the browser `tabs.sendMessage` collaborator once before fanout and crosses a promise boundary for each send. A synchronous collaborator throw is therefore accounted for exactly like a rejected send promise instead of aborting the current batch before settlement.

One failing/restricted tab cannot prevent later valid tabs or later batches from being attempted. Existing semantics remain: tab ids are deduplicated, one structured-cloned message snapshot is reused, there is no total tab cap, and at most **32 sends** are concurrent.

Coverage: `tests/tab-fanout-sync-failure-v407.test.js`.

## Milestone 408 — Isolate Protection-actions diagnostics and teardown failures

The optional browser-owned Protection-actions helper now captures a supplied own-data `warn` callback once, preserves the original logger receiver, and treats diagnostic delivery as best effort. Logger accessor traps are not executed, later mutation cannot swap the captured callback, and a throwing logger cannot convert optional synchronization failure into an unhandled failure path.

Disposal also isolates `storage.onChanged.removeListener` failure in a `try/finally`. Even if browser listener removal throws, the installation identity is released, disposal remains idempotent, and a later installation can proceed. This does not change preference persistence, browser-owned count behavior, or the zero-request-observation design.

Coverage: `tests/action-count-logger-receiver-v408.test.js` and `tests/action-count-teardown-v408.test.js`.

## Milestone 409 — Documentation and exact-head release-gate synchronization

This document, `ROADMAP.md`, draft PR #7, and Issue #10 are synchronized to the resulting exact implementation head. PR #7 remains draft and Issue #10 remains the authoritative Chromium + Firefox qualification gate.

Connector-created or connector-edited regression coverage in this block is repository coverage only. It was **not executed here**. No `npm ci`, `npm run check`, packaging, release verification, reproducibility, source qualification, qualification-record generation, or real-browser observation is claimed by these connector-only changes.

## Privacy and product invariants retained

- no telemetry, analytics, browsing/request history, retained matched-rule history, statistics database, identifiers, page/DOM history, or custom Drop Ads backend
- no permission expansion
- no remote executable code
- aggressive browser-local blocking with recovery controls remains intact
- network precedence remains **personal allow > personal block > shared allow > shared block**
- cosmetic precedence remains **personal allow > personal hide > shared allow > shared hide**
- GitHub community preparation remains optional and off by default
