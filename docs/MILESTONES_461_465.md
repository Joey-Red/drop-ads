# Milestones 461–465 — Message-guard boundary hardening

This block follows the independently landed M456–460 reconciliation sequence and tightens the shared background runtime-message guard without changing product behavior, permissions, retention, or privacy policy. Connector-created or connector-edited regression coverage is repository coverage only and was **not executed locally or in a browser**.

The focused test files were created before the concurrent M456–460 sequence became visible, so their historical `v456`–`v459` filenames are intentionally retained to avoid needless file churn. The canonical milestone numbers for this block are M461–465.

## Milestone 461 — Strict direct validator group admission

`validateBackgroundRuntimeMessage(message, group)` admits only the primitive strings `core` and `cosmetic` before inspecting the message. Invalid or type-confused group values fail deterministically instead of becoming benign cross-group misses. The direct validator and installed guard share the same group boundary; valid cross-group messages still return `handled: false`.

Coverage: `tests/message-validator-group-v456.test.js`.

## Milestone 462 — One-shot message-guard option snapshot

`createMessageGuardedApi()` detaches the exact `group` / optional `rejectUnknown` option record once through the existing descriptor-safe data boundary before collaborator setup. Later guard construction consumes only the detached record. Core defaults to rejecting unknown messages, cosmetic defaults to declining them, and an explicitly supplied `rejectUnknown` remains primitive-boolean-only.

Coverage: `tests/message-guard-options-v457.test.js`.

## Milestone 463 — Captured runtime event collaborators

The guard captures the `runtime` namespace, `runtime.onMessage` event, required `addListener`, and optional `removeListener` through bounded descriptor/prototype inspection with a reviewed depth of **8**. Listener methods are converted to receiver-preserving `Reflect.apply` closures and never re-read during registration or removal. Accessor, trapped, and revoked collaborator shapes fail closed, while class/prototype data properties remain compatible.

Existing wrapper identity, duplicate-listener suppression, failed-registration rollback, logical-removal-first semantics, response containment, and cross-group routing remain unchanged.

Coverage: `tests/message-guard-collaborators-v458.test.js`.

## Milestone 464 — Intrinsic guarded-runtime method forwarding

Non-`onMessage` runtime functions forwarded through the guarded runtime proxy preserve the original runtime receiver with `Reflect.apply` closures. Forwarding no longer reads a function's caller-controlled `.bind` property. Non-function runtime properties and the guarded `onMessage` substitution retain their existing behavior.

Coverage: `tests/message-guard-runtime-forward-v459.test.js`.

## Milestone 465 — Documentation and exact-head release synchronization

This document is the canonical detailed record for M461–465. Because multiple writers are concurrently extending the same draft branch, this synchronization deliberately does **not** replace `ROADMAP.md` from a potentially stale whole-file snapshot. Draft PR #7 links this record, while Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.

No `npm ci`, `npm run check`, package/release/reproducibility/source-qualification command, or real-browser qualification is claimed by this connector-only block. Any later source commit supersedes the exact head recorded for this synchronization and requires fresh preflight/browser observations.

## Privacy invariants

No telemetry, analytics, browsing history, request history, retained matched-rule or blocked-request statistics, DOM/page history, identifiers, cookie database access, custom backend, permission expansion, polling, or retention expansion was introduced by these milestones.
