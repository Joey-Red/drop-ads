# Milestones 719–728 — Session-state and session-storage hardening

This block hardens the browser-session recovery state used for temporary per-site pauses. It does not add telemetry, browsing/request history, page/DOM capture, retained statistics, identifiers, remote executable code, or an owned backend. Repository tests/audits are preflight only; Issue #10 remains the exact-head real Chromium + Firefox release gate.

## M719 — Explicit session defaults

Removed ambient `structuredClone` from session default construction. The shared default `disabledSites` collection is frozen and fresh defaults are explicitly constructed.

## M720 — Immutable normalized session state

Default and normalized session snapshots are frozen and detached, including canonical `disabledSites` arrays. Session updates no longer rely on mutating normalized state.

## M721 — Strict stored-value presence semantics

Only an absent (`undefined`) session-storage value receives a fresh default. Present malformed primitives or arrays enter strict normalization and fail closed instead of masquerading as a clean session.

## M722 — Descriptor-safe session-storage collaborators

`storage.session`, `get`, and `set` are captured through bounded descriptor-only prototype traversal into a frozen collaborator boundary. Method receivers are preserved. Genuine capability absence keeps the supported fallback, while accessors, revoked proxies, invalid namespaces, and unsafe traversal fail closed without getter invocation.

## M723 — Immutable pause updates

Pause/unpause changes pass through a dedicated canonical snapshot boundary. The prior loaded state is not mutated; the next session state is frozen before persistence.

## M724 — Canonical writable session schema

Writes require the exact session schema with an explicit own enumerable `disabledSites` data field. Missing fields, extras, accessors, null/non-array values, and malformed data are rejected before persistence; valid values are canonicalized.

## M725 — Frozen storage write envelopes

`storage.session.set` receives a frozen envelope containing the already-canonical frozen session snapshot. Caller or collaborator mutation cannot alter the validated write snapshot while the persisted key/wire shape remains unchanged.

## M726 — Hostile boundary regressions

Focused regressions cover storage-result/state-field accessors, revoked proxies, sparse and oversized domain arrays, immutable canonical neighboring behavior, and mutation isolation.

## M727 — Executable hardening gate

Added `tools/session-state-hardening-audit.mjs`, wired as `npm run session-state-hardening-audit` and included in `npm run check`. The audit enforces M719–M726 source contracts and requires the focused regression files.

## M728 — State synchronization

Synchronized this block into the canonical roadmap, post-merge qualification guidance, qualification runbook, qualification-state audit, and Issue #10 without claiming local test execution or browser qualification.

## Release evidence boundary

All work in this block was created through the repository connector. The added tests and audits were not executed locally or in browsers in this continuation. A passing repository audit would remain preflight evidence, not a Chromium/Firefox observation. Any source change invalidates prior browser observations for an older exact head.
