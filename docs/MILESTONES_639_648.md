# Milestones 639–648 — Source qualification hardening

This block hardens `npm run qualify:sources`, which remains a non-browser preflight step. Nothing in this block is evidence that Chromium or Firefox was opened, exercised, or release-qualified.

## M639 — Snapshot source qualification inputs safely

Added descriptor-only snapshots for CLI/source ids and top-level source-qualification options. Id arrays must be standard dense arrays, are bounded to 64 entries, reject duplicates/control text/extra fields, and do not execute accessors.

## M640 — Snapshot HEAD diagnostic collaborators safely

Added a descriptor-only HEAD timeout/collaborator boundary with a 30-second hard ceiling. Timer, clear-timer, and AbortController collaborators must be callable data properties.

## M641 — Snapshot HEAD response metadata safely

Optional HEAD metadata is admitted only through data-property inspection. `headers.get` is invoked with its captured receiver and Content-Length is accepted only as canonical non-negative safe-integer decimal text. Unsafe optional metadata becomes unavailable rather than qualification evidence.

## M642 — Normalize subscription inputs before source qualification

Every per-source qualification path normalizes the subscription through the existing descriptor-safe/public-HTTPS subscription schema before HEAD or bounded GET work. Built-in selection and reporting use normalized copies.

## M643 — Snapshot per-source qualification options safely

The exported per-source entrypoint accepts only an optional `headTimeoutOptions` data field. Accessors, extra/symbol fields, custom prototypes, and traps fail before network work.

## M644 — Make failures privacy-minimal

Raw thrown values and remote/parser error text no longer enter source qualification reports. A failed built-in source contributes only its normalized id and the fixed code `source-unavailable-or-invalid`.

## M645 — Validate and bound source qualification reports

Added an exact descriptor-safe report schema for source rows, network/cosmetic counts, totals, and failures. JSON output is normalized plain data capped at 128 KiB. URL fields and arbitrary failure strings are not part of the output schema.

## M646 — Contain direct HEAD diagnostic targets

The exported HEAD diagnostic now accepts only string targets that pass the existing public HTTPS subscription-source policy. Non-HTTPS, credentialed, malformed, oversized, local/private/non-public targets fail before fetch. The fetch collaborator must be callable.

## M647 — Enforce source qualification hardening

Added `tools/source-qualification-hardening-audit.mjs` and wired it into `npm run check`. The audit requires the M639–M646 boundaries and rejects raw `error.message`, `String(error)`, and direct report JSON serialization paths.

## M648 — Synchronize qualification state

Updated the roadmap, exact-head runbook, post-merge state, current-state audit, and Issue #10 guidance. The temporary milestone-only placeholder file was removed.

## Evidence boundary

The code, tests, audits, and documentation in M639–M648 were created through the repository connector in this continuation. They were not executed locally and were not exercised in Chromium or Firefox here. They are repository/preflight coverage only. Issue #10 remains the authoritative real-browser release gate for the exact candidate head.

The project invariants remain unchanged: no telemetry, analytics, browsing/request history, matched-element history, retained blocked-request statistics, user/device identifiers, or owned Drop Ads tracking backend.
