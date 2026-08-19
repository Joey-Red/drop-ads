# Milestones 649–658 — Source qualification summary and report hardening

This block extends the M639–M648 network-source qualification boundary without changing the release standard: real Firefox + Chromium qualification remains the Issue #10 gate, and connector-created repository coverage is not browser evidence.

## M649 — Capture HEAD AbortController collaborators safely

Added `tools/source-head-controller.mjs`. Native AbortController signal/abort collaborators are captured through intrinsic descriptors; injected controllers must be plain objects with enumerable own data fields. Abort dispatch preserves its receiver, and accessors, extra fields, custom prototypes, and unsafe inspection fail closed.

## M650 — Isolate HEAD timer cleanup failures

HEAD diagnostic timer cleanup is best-effort. A throwing cleanup collaborator cannot replace a successful, unavailable, or timed-out optional diagnostic outcome, while timeout-option validation still occurs before network work.

## M651 — Snapshot source-summary result containers safely

Added a bounded descriptor-only snapshot for source qualification result arrays. Results must be a standard dense array with at most 64 exact plain `{ subscription, parsed, declaredBytes }` data entries. Holes, accessors, symbols, extra fields, custom prototypes, and unsafe inspection fail closed before sorting or aggregation.

## M652 — Normalize summary subscription metadata

Every summary subscription is normalized through the existing descriptor-safe public HTTPS subscription schema and frozen. Optional declared-byte metadata must be null or a non-negative safe integer, so aggregation no longer consults caller-owned subscription structure.

## M653 — Snapshot parsed source policy before summary work

Parsed source policy must be an exact data object containing `block`, `allow`, `cosmeticHide`, `cosmeticAllow`, and `sourceKey`. All four rule arrays are dense-snapshotted and frozen under the existing remote supported-rule ceiling before rule-key aggregation.

## M654 — Bind parsed policy to normalized subscription identity

The parsed `sourceKey` must exactly match `subscriptionSourceKey()` for the normalized subscription. A result cannot combine policy produced for one source with metadata for another source.

## M655 — Enforce report count consistency

Source report validation now cross-checks direct rule counts, supported counts, unique/overlap partitions, and report totals. Inconsistent count summaries fail before serialization.

## M656 — Enforce deterministic report identity sets

Successful source ids and failed source ids must each be unique and strictly ascending, and the two sets must be disjoint. Ambiguous or reordered reports fail validation before output.

## M657 — Enforce expanded source qualification hardening

`source-qualification-hardening-audit` now protects the M649–M656 controller, cleanup, summary, source-binding, count-consistency, and deterministic-identity boundaries in addition to the M639–M648 protections. It also rejects regression to direct unsnapshotted source-result aggregation. The audit remains part of `npm run check`.

## M658 — Synchronize current state

This document, the canonical roadmap, post-merge qualification state, exact-head runbook, current-state audit, and Issue #10 guidance are synchronized through M658. M659 is the next canonical milestone.

## Privacy and evidence boundary

The source-qualification path remains privacy-minimal: no telemetry, analytics, browsing/request history, retained blocked-request statistics, user/device identifiers, arbitrary remote error text, or owned Drop Ads backend is introduced. HEAD remains optional diagnostic metadata; bounded GET/parser admission remains authoritative for remote source handling.

The code, tests, audits, and documentation in M649–M658 were created through the repository connector in this continuation and were not executed locally or in Firefox/Chromium here. They are repository preflight coverage only. No browser qualification or release qualification is claimed.
