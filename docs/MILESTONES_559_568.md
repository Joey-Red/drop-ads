# Milestones 559–568 — exact browser qualification matrix hardening

This block turns the privacy-minimal browser observation artifact into an exact, auditable per-scenario qualification matrix while preserving the rule that repository tooling is preflight only. It does not claim that Firefox or Chromium qualification has been executed.

## M559 — Descriptor-safe observation candidate validation

`qualification-observation-record-audit.mjs` now validates nested candidate package/artifact data before comparing it with the authoritative qualification record. Candidate identity comparisons use data-descriptor reads rather than normal property access, containing accessor/custom-prototype/proxy-shaped input before it can influence exact-head binding.

## M560 — Nested observation identity trap coverage

Focused regression coverage rejects candidate package/artifact accessors without executing getters, rejects custom-prototype nested records, and fails closed on revoked proxy-shaped nested candidate data while preserving ordinary identity-mismatch diagnostics.

## M561 — Canonical browser qualification scenario catalog

Added `tools/qualification-scenarios.mjs` with one canonical 14-group scenario catalog. The generated observation artifact is now schema v2: candidate identity remains copied from the validated qualification record, browser version/notes metadata is separate, and every canonical scenario starts with Chromium/Firefox `UNOBSERVED` plus empty behavior notes.

## M562 — Exact v2 observation-record validation

The observation-record audit now requires the exact v2 root/schema, exact canonical scenario set, exact scenario-result fields, the `UNOBSERVED`/`PASS`/`FAIL`/`N/A` status vocabulary, bounded safe notes, and a browser version before any scenario for that browser can be treated as observed. Notes cannot be prefilled on a wholly unobserved scenario.

## M563 — v2 scenario lifecycle coverage

Focused tests cover exact scenario seeding, missing/unknown ids, status lifecycle, browser-version prerequisites, bounded notes, mixed browser outcomes, and the existing descriptor-safe candidate boundary.

## M564 — Human worksheet / JSON scenario alignment

`docs/QUALIFICATION_OBSERVATION_TEMPLATE.md` now names every canonical scenario id beside the human-readable group. Manual results map one-to-one into `artifacts/qualification-observation.json`; generated `UNOBSERVED` values remain untouched until a real browser exercise occurs.

## M565 — Template/catalog parity audit

`qualification-observation-audit.mjs` imports the canonical scenario catalog and requires the documentation table to contain the same ids exactly once and in canonical order. The audit also requires schema-v2, `UNOBSERVED`, observation-record audit, exact-head identity, and privacy-prohibition guidance.

## M566 — Privacy-minimal qualification readiness summary

Added `tools/qualification-observation-summary.mjs`. It validates the v2 observation/candidate binding, then reports only per-browser counts of PASS/FAIL/N/A/UNOBSERVED, completeness/passing booleans, scenario count, and overall readiness. It deliberately omits commit/fingerprint/package identity, browser versions, notes, URLs, machine/user/path/time/environment data, and history.

## M567 — `qualify:status` and summary coverage

Added `npm run qualify:status` as a read-only local summary command. Focused tests cover empty, partial, failing, N/A, fully passing, and stale-identity cases and verify that summary output remains non-identifying and does not launch browsers, networking, or the fixture server.

## M568 — Qualification workflow synchronization

Canonical roadmap, post-merge qualification state, runbook, and Issue #10 are synchronized around the schema-v2 scenario artifact and readiness summary. The workflow remains: exact-head non-browser preflight and observation seed, real Chromium/Firefox exercise against the same candidate, observation-record audit, then privacy-minimal status summary. Any source/package identity change invalidates observations.

## Validation status

Connector-created repository files, tests, audits, generated schemas, and status tooling in this block are source/preflight work only unless they are actually executed from a clean exact-head checkout. A generated `UNOBSERVED` matrix and `qualify:status` output do not constitute a browser observation. Issue #10 remains the authoritative real Firefox + Chromium qualification gate.

No milestone in this block adds telemetry, analytics, browsing/request history, retained statistics, request observation, user/device identifiers, machine identity collection, or an owned Drop Ads backend.
