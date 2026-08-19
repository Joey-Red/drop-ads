# Milestones 451–455 — Bootstrap collaborator hardening

This block tightens background bootstrap collaborator admission and capture after the independently synchronized M445–450 popup resilience/accessibility block. It does not change product behavior, permissions, retention, or privacy policy. Connector-created or connector-edited regression coverage is repository coverage only and was **not executed locally or in a browser**.

## Milestone 451 — Intrinsic callback binding

`src/core/background-bootstrap.js` receiver-binds captured warning and disposer callbacks through the intrinsic `Function.prototype.bind` invoked with `Reflect.apply`. The bootstrap path therefore never reads a caller-controlled callable `.bind` property after the function itself has passed validation.

This applies to supplied/default warning callbacks, optional-feature disposers, and core/mandatory-layer disposers. Existing receiver semantics, optional-feature failure isolation, startup rollback, reverse teardown ordering, idempotence, and best-effort diagnostics remain unchanged.

## Milestone 452 — Raw optional feature-name admission

Optional feature names enforce the existing **64-character** ceiling on the raw string before `trim()` is called. Accepted names remain primitive strings that are non-empty and already trimmed. The existing **32-feature** ceiling, duplicate-name detection, prototype-safe status record, and optional installation isolation remain unchanged.

## Milestone 453 — Intrinsic Map brand admission

A supplied optional-registration store is admitted once through an intrinsic `Map` internal-slot probe rather than `instanceof`. Genuine `Map` and `Map` subclass instances are accepted, while fake objects, proxies without a usable Map internal slot, and revoked proxies fail deterministically before optional installation begins. The admission decision is reused for the install loop.

## Milestone 454 — Intrinsic registration storage

Optional registration writes invoke the intrinsic `Map.prototype.set` with the admitted Map receiver. Installation no longer reads a mutable or poisoned `registrations.set` property after Map admission. Registration ordering/content, captured-disposer semantics, optional failure isolation, and teardown behavior remain unchanged.

## Milestone 455 — Documentation and exact-head release-gate synchronization

This document records the M451–455 bootstrap collaborator boundary. Because several writers are concurrently extending the same draft branch, this synchronization deliberately does **not** replace `ROADMAP.md` from a stale snapshot; the current canonical roadmap is preserved and this detailed record is linked directly from draft PR #7. Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.

No `npm ci`, `npm run check`, package/release/reproducibility/source-qualification command, or real-browser qualification is claimed by this connector-only block. Any later source commit supersedes the exact head recorded for this synchronization and requires fresh preflight/browser observations.

## Privacy invariants

No telemetry, analytics, browsing history, request history, retained matched-rule or blocked-request statistics, DOM/page history, identifiers, cookie database access, custom backend, permission expansion, or retention expansion was introduced by these milestones.
