# Milestones 438–445 — Post-M437 collaborator and lifecycle hardening

This document follows the canonical sequence in `ROADMAP.md` and closes its exact-head synchronization step without changing Drop Ads privacy, permissions, retention, blocking precedence, or serverless operation. Connector-created or connector-edited regression coverage described here is repository coverage only and was **not executed locally or in Chromium/Firefox here**.

## Milestone 438 — Background core listener lifecycle

Core background listener ownership uses stable callback identities, transactional registration rollback, idempotent teardown, and inactive-after-dispose guards. A partially failed start removes already-added listeners, and disposal marks retained callbacks inert before best-effort browser removal so a teardown failure cannot reactivate background work.

## Milestone 439 — Capture abort-signal collaborators safely

Bounded remote-list reads capture abort state plus listener collaborators through native-compatible descriptor boundaries. Native `AbortSignal` uses the platform accessor and receiver-bound `EventTarget` operations; synthetic signals require descriptor-safe own-data state/functions. Later reader/cleanup work uses only the captured interface and listener removal remains best effort.

Coverage includes `tests/list-abort-signal-capture-v439.test.js` and historical-name equivalents retained in repository history.

## Milestone 440 — Capture timeout AbortController collaborators

List-download timeout setup captures the constructed controller signal and receiver-bound abort operation before timer/task scheduling. Native platform collaborators and safe injected plain-data controllers remain supported; malformed injected controllers fail before task work. Timer cleanup is best effort so a throwing clear callback cannot replace a successful or actionable failed task outcome. The reviewed **1–120,000 ms** timeout range and abort-on-timeout semantics remain unchanged.

## Milestone 441 — Contain direct cache-encoder array-kind failures

Direct network/cosmetic cache encoders contain revoked or otherwise uninspectable collection array-kind failures before dense-array work. Ordinary non-array compatibility continues to produce the reviewed empty fallback, while admitted arrays remain subject to the existing **300,000 raw policy-item** work ceiling and canonical remote-rule validation.

## Milestone 442 — Contain cosmetic runtime response-channel failures

Cosmetic runtime asynchronous success/failure delivery routes through best-effort response publication. Missing, closed, non-function, or throwing response channels cannot escape continuations or alter mutation/queue outcomes. Exact response payloads and the existing **1,024-character** cosmetic failure-text boundary remain unchanged.

Coverage includes `tests/cosmetic-runtime-response-channel-v432.test.js` (historical filename retained).

## Milestone 443 — Detach direct external-subscription admission

Direct external-subscription admission snapshots the exact `id` / `title` / `format` / `sourceUrl` / optional `enabled` data before normalization, state/cache reads, or source fetch. Caller-supplied `builtIn` cannot cross this direct boundary; external subscriptions are forced to `builtIn: false` internally. Malformed/accessor-backed input therefore fails before network work while canonical public-HTTPS semantics remain unchanged.

## Milestone 444 — Capture streamed reader operations once

Remote-list streamed readers capture native-compatible `read` and optional `cancel` operations once with the original reader receiver before the bounded read loop. Synthetic readers require safe own-data functions, later method mutation cannot redirect reading or cancellation, and cancellation remains best effort. Existing exact reader-result schemas, the **5,000,000-byte** ceiling, fatal UTF-8 handling, and streaming semantics are unchanged.

Coverage includes `tests/list-reader-operation-capture-v438.test.js` and historical-name equivalents retained in repository history.

## Supporting hardening completed on the same development line

Additional landed work after the prior exact-head sync is recorded as supporting hardening rather than being renumbered over the canonical ROADMAP sequence: background runtime constructor options are detached once before setup; popup committed-state render coalescing recovers from `queueMicrotask()` scheduling failure; optional feature registration maps use intrinsic Map brand/store operations; Protection-actions event methods are captured once; runtime/cosmetic failure delivery remains bounded and response-channel-safe. These changes preserve the same zero-telemetry and no-history architecture.

## Milestone 445 — Documentation and exact-head synchronization

This milestone reconciles the detailed post-M437 record with `ROADMAP.md`, synchronizes draft PR #7, and records the resulting exact branch head on Issue #10. PR #7 remains draft and Issue #10 remains open because repository coverage does not substitute for clean exact-head machine preflight, deterministic package/source qualification, and real Chromium plus Firefox observations against the same package hashes.

## Validation status

No `npm ci`, `npm run check`, package/release verification, reproducibility check, source qualification, qualification-record generation, or browser qualification result is claimed by this block. GitHub-hosted Actions runner allocation remains externally blocked by the account billing/spending-limit state; that is neither a product failure nor a successful qualification.

No milestone or supporting change in this record adds telemetry, analytics, browsing/request history, retained matched-element/page-content history, identifiers, a custom backend, new permissions, remote executable code, or new retention behavior.
