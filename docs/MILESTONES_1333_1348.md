# Milestones 1333–1348 — Qualification observation integrity and privacy

This tranche is **source-only hardening**. It does not constitute Chromium or Firefox runtime qualification, does not satisfy browser-observation checkboxes, and does not replace the exact-head release gate in Issue #10.

## Completed milestones

- **M1333** — Canonicalized qualification observation version/notes text with UTF-8 byte ceilings, well-formed NFC Unicode, and invisible/control rejection.
- **M1334** — Added descriptor-safe, dense, bounded CLI argv admission before observation parsing.
- **M1335** — Routed parsed CLI updates through the same descriptor-safe canonical update publication boundary used by direct callers.
- **M1336** — Invalidated all scenario evidence for a browser whenever its recorded browser version identity actually changes.
- **M1337** — Locked the complementary invariant that notes-only edits with the same browser version preserve scenario evidence.
- **M1338** — Centralized version-change invalidation in a descriptor-safe exact scenario-graph reset helper.
- **M1339** — Added a second exact-head checkout validation after draft validation and immediately before atomic observation persistence.
- **M1340** — Centralized the observation text contract and canonical byte limits in one shared module.
- **M1341** — Routed observation update publication through the shared text contract.
- **M1342** — Routed observation record auditing through the same shared text contract.
- **M1343** — Froze an exact bounded source inventory for observation hardening audits.
- **M1344** — Added the bounded qualification-observation hardening-chain audit with tamper regression coverage.
- **M1345** — Wired the observation hardening audit into the canonical `npm run check` gate.
- **M1346** — Added an observation privacy-surface audit rejecting automatic network/browser/machine/user/storage/timestamp collection surfaces.
- **M1347** — Composed the privacy audit into the canonical observation hardening gate while preserving the M1344 compatibility marker.
- **M1348** — Closed the tranche with this source-only qualification boundary record and supporting Issue #10 evidence.

## Invariants now locked

1. Browser versions are bounded to 120 UTF-8 bytes; observation notes are bounded to 2,000 UTF-8 bytes.
2. Accepted observation text is primitive, well-formed NFC Unicode and rejects C0/C1, zero-width, BOM, line-separator, and bidi-control text.
3. Observation CLI argv is a bounded exact dense own-data string array; accessors, holes, symbols, extras, and oversized input fail closed.
4. CLI and direct-object updates converge on one descriptor-safe canonical publication boundary.
5. Changing a browser version requires explicit replacement and invalidates every scenario observation for that browser; notes-only changes do not.
6. Scenario invalidation validates the complete canonical schema-v3 scenario graph before mutating any leaf.
7. Observation updates validate the exact qualification checkout both before mutation and again after candidate validation immediately before persistence.
8. Atomic observation persistence retains restrictive temporary-file creation, conflict checking, same-directory rename, cleanup, and exclusive command locking.
9. The hardening audit reads only an immutable five-file inventory under explicit per-file and aggregate byte ceilings.
10. The reviewed observation hardening chain may not add browser/network APIs, browser storage, environment/cwd/host/user/home discovery, timestamps, performance timing, or networking-module imports.
11. The canonical `npm run check` gate includes the composed observation hardening/privacy audit.
12. None of these source checks may synthesize, infer, or report a Chromium/Firefox runtime qualification pass.

## Qualification boundary

Issue #10 remains the authoritative cross-browser runtime qualification gate. Real Chromium and Firefox observations must still be performed against the same exact qualification record, source commit, source fingerprint, and package hashes. If the source head or fingerprint changes, prior browser observations cannot be carried forward as current evidence.

Connector-created source files and regressions in this tranche were not represented as locally executed tests or browser observations.
