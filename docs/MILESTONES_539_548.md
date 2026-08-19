# Milestones 539–548 — post-merge qualification hardening

This block strengthens the release/qualification workflow after PR #7 was merged into `main`. It does not claim that Firefox or Chromium qualification has been executed.

## M539 — Post-merge qualification-state audit

Added `tools/qualification-state-audit.mjs` to protect current release semantics: `main` is authoritative, Issue #10 is the real cross-browser gate, browser observations are exact-head/package-hash scoped, and obsolete pre-merge draft instructions are rejected from current-state qualification documentation.

## M540 — Qualification-state audit in `npm run check`

Added `qualification-state-audit` to package scripts and normal repository preflight.

## M541 — Qualification-state audit contract coverage

Added focused tests that lock the audit’s required current-state phrases, obsolete-draft rejection, Settings-boundary qualification wording, and `npm run check` integration.

## M542 — Exact-head browser qualification runbook

Added `docs/QUALIFICATION_RUNBOOK.md` with the clean-head workflow, ordered preflight/package/release/reproducibility/source/record commands, same-package Chromium/Firefox requirement, and source-change invalidation rule.

## M543 — Privacy-minimal browser observation template

Added `docs/QUALIFICATION_OBSERVATION_TEMPLATE.md`. It records only candidate commit/fingerprint, package hashes/sizes, browser versions, bounded behavior results, and concise browser differences. It explicitly forbids host/user/path/time/environment, browsing/request history, personal URLs, identifiers, statistics, cookies, and page/DOM captures.

## M544 — Observation-template privacy audit

Added `tools/qualification-observation-audit.mjs` to require exact candidate/browser identity, PASS/FAIL/N/A semantics, invalidation language, privacy prohibitions, and rejection of machine/user identity fields.

## M545 — Observation-template audit in `npm run check`

Added `qualification-observation-audit` to package scripts and the standard check sequence.

## M546 — Observation-template audit contract coverage

Added focused tests for identity, invalidation, privacy-prohibition, forbidden-field, and package-script/check integration requirements.

## M547 — One-command qualification preflight

Added `npm run qualify:preflight`, which sequentially runs `check`, `package`, `verify:release`, `verify:reproducible`, `qualify:sources`, and `qualify:record`. It intentionally does not start the fixture server or represent browser qualification.

## M548 — Qualification synchronization and preflight contract

Added focused coverage ensuring `qualify:preflight` preserves the documented command order and cannot start browser fixture work. This milestone also synchronizes the post-merge qualification note and Issue #10 with the M539–M548 workflow.

## Validation status

Connector-created repository files/tests/audits in this block are source/preflight coverage only unless actually executed from a clean checkout. Issue #10 remains the authoritative real Firefox + Chromium qualification gate for the exact current `main` commit and generated package hashes.

No milestone in this block adds telemetry, analytics, browsing/request history, retained statistics, identifiers, request observation, or an owned Drop Ads backend.
