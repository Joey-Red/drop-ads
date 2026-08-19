# Milestones 1082–1091 — Phased cookie-banner qualification guidance

This sequence makes the first-class `cookie-banner-rejection` exact-head scenario easier to execute without turning qualification tooling into telemetry or progress tracking. Repository tests, audits, source-only phase metadata, fixture inventories, commands, and documentation remain supporting preflight evidence only; Issue #10 remains the authoritative Chromium + Firefox release gate.

## M1082 — Structured phase catalog

Added `tools/qualification-cookie-banner-checklist.mjs` with seven ordered immutable source-only phases: `mode-site-recovery`, `localization`, `action-identity`, `context-semantics`, `platform-controller`, `late-shadow-revalidation`, and `privacy-finalization`. Each phase carries stable documents, local commands, expected behavior, and later fixture bindings without storing observations.

## M1083 — Scenario guidance binding

Bound `qualification-scenario-guide.mjs` to the canonical phase ids/count, added the per-site qualification guide, and preserved deterministic local-only commands.

## M1084 — Phase-specific CLI guidance

Extended `npm run qualify:scenario -- cookie-banner-rejection` with strict optional `--phase <phase-id>` selection while preserving the original one-argument output. Unknown phases and malformed argument shapes fail closed.

## M1085 — Phased exact-head guide

Reorganized `docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md` around the seven phase ids and added exact phase commands. The guide states explicitly that phases do not create seven persisted results and that only the existing browser scenario status/notes are recorded.

## M1086 — Canonical fixture inventory

Added `tools/qualification-cookie-banner-fixtures.mjs` describing the main `qualify:serve` cookie-banner anchors, the action-source safety fixture, and the complete six-language localization matrix using stable loopback hosts, ports, commands, and routes.

## M1087 — Phase-to-fixture binding

Each phase now names the exact fixture ids it uses. Phase-specific CLI output resolves those ids to immutable fixture descriptors, making the required local surfaces explicit without reading browser or observation state.

## M1088 — Checklist integrity audit

Added `tools/qualification-cookie-banner-checklist-audit.mjs`. It verifies exact phase/fixture order, loopback identities and bounds, inventoried routes/anchors against fixture sources, guide phase headings/commands, source-only privacy boundaries, and focused M1082–M1087 regressions.

## M1089 — Canonical preflight wiring

Added `qualification-cookie-banner-checklist-audit` to `package.json` and `npm run check` immediately after the existing cookie-banner scenario audit.

## M1090 — Canonical sequence documentation

This document records the phase/checklist/fixture/audit work and its evidence boundary before final synchronization.

## M1091 — Canonical synchronization

Updated `ROADMAP.md` with the M1082–M1091 history, advanced the next canonical milestone to M1092, and added the seven-phase/fixture/checklist-audit requirements to the exact-head release gate. The same qualification delta was added to Issue #10 without claiming browser validation, and final roadmap regression coverage preserves the one-result-per-browser evidence model.

## Privacy and evidence boundary

The phase/checklist framework is static repository metadata. It does not read or retain URL, page, banner, action, accessibility-name, consent, DOM, request, cookie, frame, document, observer, platform, language, browser history, statistics, timestamps, identifiers, analytics, telemetry, environment identity, or owned backend data.

The phase model is not progress tracking. There is still one browser-specific `cookie-banner-rejection` result per exact candidate browser in the qualification observation. A phase listing, fixture status message, source commit, test, audit, documentation file, issue closure, or generated `UNOBSERVED` record never counts as a browser pass. Exact current-package observations in both Chromium and Firefox must be recorded through the guarded Issue #10 workflow.
