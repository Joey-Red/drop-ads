# Milestones 1072–1081 — Cookie-banner qualification scenario integration

This sequence turns the extensive cookie-banner exact-head guidance into one required schema-v3 browser observation while preserving Drop Ads' zero-telemetry boundary. Repository tests, audits, fixtures, commands, and documentation remain supporting preflight evidence only; Issue #10 remains the authoritative Chromium + Firefox release gate.

## M1072 — First-class browser scenario

Added `cookie-banner-rejection` to `QUALIFICATION_SCENARIOS` immediately before `privacy-invariants`. New schema-v3 observation seeds therefore require independent Chromium and Firefox status/notes for cookie-banner behavior.

## M1073 — Source-only scenario guidance

Added `tools/qualification-scenario-guide.mjs`. The cookie-banner scenario points only to reviewed repository documents and local loopback commands. Unknown scenario IDs fail closed; the guidance helper reads no observation, browser, machine, user, time, or network state.

## M1074 — Scenario guidance command

Added `npm run qualify:scenario -- <scenario-id>` through `tools/qualification-scenario-command.mjs`. Output is deterministic JSON source metadata and does not read qualification artifacts or environmental identity.

## M1075 — Consolidated exact-head checklist

Added `docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md` covering Reject/Off, per-site exclusion, localization, action-source/context/semantics refusal, base/platform/controller ownership, immediate/late/open-shadow behavior, candidate invalidation, and zero-retention requirements. It includes exact guarded `qualify:mark` commands but no fabricated observations.

## M1076 — Dedicated scenario audit

Added `tools/qualification-cookie-banner-scenario-audit.mjs` to protect canonical placement, UNOBSERVED seeding, source-only guidance, the consolidated guide, exact mark commands, privacy boundaries, and focused M1072–M1075 regressions.

## M1077 — Canonical preflight wiring

Added `qualification-cookie-banner-scenario-audit` to `package.json` and `npm run check` without replacing existing qualification or cookie-banner gates.

## M1078 — Readiness and ordering lock

Added regression coverage that the schema-v3 matrix has 15 scenarios, that cookie-banner remains required before qualification can be ready, and that ordered next-step traversal reaches it before final privacy invariants.

## M1079 — Stale M950 tracker reconciliation

Bound the historical per-site qualification tracker to the implemented `qualify:serve` loopback fixture and `COOKIE_BANNER_SITE_QUALIFICATION.md`, then closed stale Issue #1590. The fixture contains immediate and delayed open-shadow controls and records no qualification results.

## M1080 — Canonical sequence documentation

This document records the sequence and its evidence boundary before final roadmap synchronization.

## M1081 — Canonical synchronization

Updated `ROADMAP.md` with the M1072–M1081 history, advanced canonical allocation to M1082, added the first-class cookie-banner observation/audit/guidance requirements to the release gate, and posted the same exact-head qualification delta to Issue #10 without claiming a browser pass. Historical M1071 roadmap coverage was reconciled so later allocation does not erase its guarantees, and final M1081 roadmap coverage protects the new canonical state.

## Privacy and evidence boundary

The scenario framework retains only the existing browser-specific status and notes fields in the qualification observation. It adds no URL, page, banner, action, accessibility-name, consent, DOM, request, cookie, frame, document, observer, platform, language, browsing history, statistics, timestamps, identifiers, analytics, telemetry, or owned backend behavior.

A source file, package, audit, fixture, guide, issue closure, or generated UNOBSERVED record is never a browser pass. Exact current-package observations in both Chromium and Firefox must be recorded through the guarded Issue #10 workflow.
