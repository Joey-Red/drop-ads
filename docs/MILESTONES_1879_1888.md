# Milestones 1879–1888 — Qualification observation v9 support-contract integrity-v37 hardening

This tranche recursively hardens source-only qualification support evidence. It does **not** create, infer, or substitute real Firefox or Chromium runtime observations; Issue #10 remains the sole browser qualification authority.

## Completed milestones

- **M1879** centralized the six-source integrity-v36 privacy authority with descriptor-safe exact path snapshots and 64 KiB/source, 384 KiB aggregate ceilings.
- **M1880** hardened the privacy matcher inventory into a descriptor-snapshotted, frozen, stateless canonical 20-matcher contract with bounded labels/patterns.
- **M1881** required exact ordered six-source `{ path, bytes }` evidence and an exact four-field frozen privacy result.
- **M1882** locked source count, byte ceilings, matcher count, result cardinality, and the historical M1876 marker into an exact privacy audit contract.
- **M1883** routed the historical M1878 integrity-v36 closeout through an exact frozen four-field constructor without changing its marker.
- **M1884** locked the integrity-v36 closeout result surface and six-source privacy cardinality into an exact closeout contract audit.
- **M1885** composed support-contract integrity v37 from exact integrity-v36 integration, privacy-contract, closeout-contract, and historical closeout evidence.
- **M1886** added a bounded six-source privacy review over the new integrity-v37 support modules.
- **M1887** bound M1885/M1886 source-only evidence to the repository's normal `npm run check` → `npm run test` gate.
- **M1888** closes the tranche with a dedicated source-only integrity-v37 closeout and ROADMAP advancement.

## Retained invariants

- Issue #10 remains the authoritative gate for real Firefox + Chromium observations on the exact packaged head.
- Repository tests, audits, markers, fixtures, docs, and deterministic packages are supporting/preflight evidence only.
- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, identifiers, environment/user/host profiling, or owned Drop Ads backend behavior is introduced.
- No embedded writable GitHub credential/token, new extension permission, or remote executable code is introduced.
- Historical markers are not rewritten when older evidence is routed through stronger result contracts.
- Connector-created tests/audits are not represented as actually executed locally, in CI, or in either browser.
