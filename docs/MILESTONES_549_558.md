# Milestones 549–558 — qualification identity and observation privacy hardening

This block tightens post-merge qualification artifacts so they prove exact candidate identity without collecting machine or user metadata. It does not claim that repository checks or Firefox/Chromium qualification have been executed.

## M549 — Host-free qualification record v4

Removed qualification host platform/architecture fields and moved the record to schema v4. The record now contains only package identity, exact Git commit, source fingerprint, Chromium/Firefox artifact hashes and byte sizes, and toolchain versions. Dirty-worktree and packaged-source binding remain mandatory.

## M550 — Strict qualification-record audit

Added `tools/qualification-record-audit.mjs`. It requires the exact privacy-minimal v4 schema, strict package/artifact/toolchain shapes, bounded hashes/sizes/version text, and rejects unknown fields such as host, timestamp, user, cwd, or environment metadata.

## M551 — Qualification-record audit trap coverage

Added focused tests for valid v4 records plus unknown metadata, malformed identity/artifacts/toolchain data, package mismatch, accessors, and custom prototypes.

## M552 — Persisted validated qualification record

`npm run qualify:record` now writes the reviewed relative path `artifacts/qualification-record.json`; the generated file is ignored by Git. `qualification-record-audit` can validate a supplied relative record path, and `qualify:preflight` now validates the persisted record immediately after generation.

## M553 — Persisted-record command contract

Added focused repository coverage for the shared record path, fail-fast preflight order, no-server behavior, output-path containment, and generated-record ignore contract.

## M554 — Observation identity bound to the validated record

Updated the manual observation template and its audit so candidate commit, fingerprint, package hashes, and byte sizes must be copied verbatim from the already validated persisted record rather than recomputed or hand-edited.

## M555 — Privacy-minimal UNOBSERVED seed

Added `tools/qualification-observation-prepare.mjs`. It validates the persisted qualification record, copies exact candidate identity, and creates `artifacts/qualification-observation.json` with Chromium and Firefox slots initialized to `UNOBSERVED`, blank version, and blank notes. The generated seed is ignored by Git and contains no host/user/time/environment/history/statistics metadata.

## M556 — Observation-record and current-head audit

Added `tools/qualification-observation-record-audit.mjs`. It requires an exact candidate/browser schema, exact identity match with the qualification record, bounded browser version/notes text, explicit `UNOBSERVED`/`PASS`/`FAIL`/`N/A` statuses, and blank version/notes while unobserved. CLI validation also requires the qualification commit and source fingerprint to still match the current clean checkout.

## M557 — One-command observation preparation and coverage

Added `npm run qualify:observation`, which validates the persisted qualification record, prepares the UNOBSERVED seed, and then validates exact-head observation binding. Focused tests cover identity mismatch, unknown fields, status transitions, text bounds, UNOBSERVED invariants, and command ordering. This command does not launch either browser or the fixture server and does not constitute browser observation.

## M558 — Roadmap and release-gate synchronization

Synchronizes the canonical roadmap, post-merge qualification note, runbook, and Issue #10 with M549–M557. The current workflow explicitly separates repository preparation, generated UNOBSERVED observation state, deterministic fixture execution, and real human-observed Firefox/Chromium results.

## Validation status

Connector-created source changes, tests, audits, and documentation in this block are repository coverage only unless actually executed from a clean checkout. An `UNOBSERVED` seed is deliberately not evidence that a browser was tested. Issue #10 remains the authoritative real Firefox + Chromium qualification gate for the exact current `main` commit and the same generated package hashes.

No milestone in this block adds telemetry, analytics, browsing/request history, retained statistics, user/device identifiers, timestamps, host identity, cookie databases, request observation, or an owned Drop Ads backend.
