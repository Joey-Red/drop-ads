# Milestones 1293–1302 — Generated-verification privacy/preflight integrity hardening

This tranche continues the generated-verification source-only qualification boundary. It hardens matcher inventories and execution, privacy source evidence, direct composite preflight success construction, audit path/ancestry state, and the composed hardening gate without changing the authoritative browser-observation workflow.

## M1293 — Exact privacy matcher inventory

The generated-verification privacy matcher set now publishes only through `freezeGeneratedVerificationPrivacySurfaceRules`. The inventory is a dense exact array capped at 32 entries, snapshotted through indexed own data descriptors without iterator execution, and every entry is revalidated as an exact frozen `{ pattern, label }` rule.

## M1294 — Exact privacy source-result inventory

Privacy success construction now descriptor-snapshots the complete source-result inventory through `snapshotGeneratedVerificationPrivacySourceResults`. Every entry must be an exact frozen own-data `{ path, source, bytes }` result in canonical source-contract order, and path/text/byte consistency is revalidated before file evidence is derived.

## M1295 — Captured privacy matcher execution

Privacy matcher admission requires the native RegExp own-key surface with only zero-valued `lastIndex`; own method/property/symbol shadowing fails closed. Scanning executes through a module-load capture of `RegExp.prototype.test` using the exact matcher receiver rather than live matcher method lookup.

## M1296 — Canonical direct preflight markers

`freezeGeneratedVerificationPreflightResult` no longer accepts arbitrary marker text that merely satisfies bounded Unicode validation. Direct result construction binds hardening, result-contract, qualification-guidance, and privacy child markers to their exact historical canonical values before success can be published.

## M1297 — Frozen canonical preflight input

`freezeGeneratedVerificationPreflightInput` now creates an exact frozen plain own-data four-marker input after descriptor-safe snapshotting and canonical marker validation. The historical `snapshotGeneratedVerificationPreflightInput` null-prototype snapshot remains available for compatibility, while composed success flows through the frozen canonical input contract.

## M1298 — Historical preflight success contract

The published seven-field preflight result surface is centralized in `PREFLIGHT_RESULT_KEYS`, and its M1240/M1249/M1251 success markers are centralized in immutable `PREFLIGHT_RESULT_MARKERS`. Result construction validates the exact frozen plain own-data shape before return, preserving all historical values while refusing accidental shape drift.

## M1299 — Exact audit path snapshots

Audit path admission now publishes through `freezeGeneratedVerificationAuditPathSnapshot`. Segment inventories are dense exact descriptor snapshots bounded to the existing 64-directory ceiling, every segment is canonical text, and the inventory must reconstruct the canonical repository-relative path exactly. Source path resolution and ancestry traversal consume validated segments by indexed access.

## M1300 — Exact audit ancestry entries

Audit ancestry state now publishes through `freezeGeneratedVerificationAuditAncestryEntry` as exact frozen own-data `{ path, state }` objects. Absolute normalized ancestry paths and reviewed frozen filesystem identity tuples are descriptor-snapshotted again before revalidation, so mutable, custom-shaped, or accessor-backed entry evidence cannot influence filesystem checks.

## M1301 — Composed hardening integration

`generated-verification-audit-preflight-hardening-audit.mjs` now requires every M1293–M1300 source marker and focused regression in the bounded source-only gate. The historical M1261 composite result marker remains unchanged; direct CLI execution additionally emits `canonical M1301 generated verification privacy/preflight integrity tranche integrated`.

## M1302 — Closeout synchronization

This tranche is synchronized into the canonical milestone record, generated-verification result qualification guidance, bounded audit/preflight hardening gate, roadmap numbering, and Issue #10 supporting evidence. The closeout marker is `canonical M1302 generated verification privacy/preflight integrity hardening closeout verified`.

## Qualification boundary

All M1293–M1302 checks are repository/source properties only. They do not record page URLs, request history, blocked actions, DOM/accessibility content, language/consent context, user/device identifiers, statistics, timestamps, analytics, telemetry, or browser observation state. **Issue #10 remains the authoritative exact-head browser qualification gate.** Repository tests, audits, source contracts, generated records, and closeout markers are supporting evidence only and must never be interpreted as Chromium or Firefox observations.
