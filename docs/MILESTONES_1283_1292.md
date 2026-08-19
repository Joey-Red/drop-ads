# Milestones 1283–1292 — Generated-verification preflight integrity hardening

This tranche hardens the source-only generated-verification audit/preflight path. It does not create browser observations. **Issue #10 remains the authoritative exact-head browser qualification gate.**

## M1283 — Bounded hardening diagnostics

`generated-verification-hardening-audit.mjs` now retains at most 128 diagnostics. Source-read failures, missing markers, and regression-read failures all route through one bounded recorder and fail immediately on attempted overflow.

## M1284 — Exact hardening success contract

Hardening success is published only through `freezeGeneratedVerificationHardeningAuditResult`, preserving the historical ten-marker result surface as an exact frozen own-data object.

## M1285 — Exact composite child result keys

Composite preflight child results must expose exactly their reviewed frozen key sets before marker consumption. Hardening, result-contract, qualification-guidance, privacy-surface, and audit/preflight-hardening results cannot add or omit fields silently.

## M1286 — Canonical composite child markers

Composite preflight now compares every child marker with its exact historical constant before publishing success. A syntactically valid but unexpected child marker fails closed.

## M1287 — Canonical privacy matcher rules

Forbidden privacy-surface matchers are created only through a validated immutable rule constructor. Each rule contains a frozen RegExp and a bounded, well-formed NFC/control-free label.

## M1288 — Bounded stateless privacy matchers

Privacy matchers must be exact native RegExp instances, begin at `lastIndex === 0`, be non-global/non-sticky, and have matcher source text no larger than 512 UTF-8 bytes. Stateful, subclassed, pre-advanced, or oversized matchers fail closed.

## M1289 — Exact audit-source snapshots

Successful bounded audit-source reads publish only exact frozen `{ path, source, bytes }` snapshots. The canonical path is revalidated and the strict-decoded source's UTF-8 byte length must exactly match the bounded read count.

## M1290 — Frozen filesystem identity tuples

Audit filesystem identity no longer retains live Node `Stats` objects. Root, ancestry, pathname, and opened-handle checks project dev, inode, mode, link count, size, mtime, and ctime from own data descriptors into exact frozen tuples before comparison.

## M1291 — Composed hardening integration

The bounded audit/preflight-hardening gate now requires the complete M1283–M1290 source and regression chain while preserving the historical M1261 result marker. Direct CLI output additionally publishes `canonical M1291 generated verification audit/preflight hardening tranche integrated` as source-only integration evidence.

## M1292 — Closeout synchronization

This milestone synchronizes the tranche into the canonical milestone history, qualification guidance, bounded source-only hardening gate, roadmap numbering, and Issue #10 supporting-evidence record. No test, audit, generated record, or marker in this tranche is a Chromium or Firefox observation.

## Privacy invariants

- Zero telemetry or analytics.
- No browsing/request history, page/DOM snapshots, blocked-action history, retained statistics, timestamps, or user/device identifiers.
- No GitHub credentials/tokens and no owned Drop Ads backend.
- Source-only audit results remain bounded, local, deterministic supporting evidence and never substitute for exact-head browser observations.
