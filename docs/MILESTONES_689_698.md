# Milestones 689–698 — Runtime fanout and cosmetic refresh hardening

This block hardens the shared tab-message fanout boundary and the live cosmetic refresh lifecycle. It does not add telemetry, request history, matched-element history, identifiers, statistics, or an owned backend, and repository-created tests/audits are not browser qualification evidence.

## M689 — Bound tab fanout target work

Shared tab fanout now rejects target collections above `MAX_TAB_MESSAGE_TARGETS = 10_000` before send work begins. Existing valid-id filtering, deduplication, order, and bounded send concurrency remain intact.

## M690 — Freeze tab fanout result snapshots

Fanout completion returns frozen `{ attempted, failed }` snapshots. The counts remain ephemeral operation results rather than retained per-tab history.

## M691 — Coalesce cosmetic refresh bursts without losing changes

Relevant local/session storage invalidations now share a queued dirty-aware refresh worker. Same-tick bursts collapse into one fanout; a change arriving during an active fanout sets the dirty flag and causes one follow-up pass so final policy state is not lost.

## M692 — Freeze cosmetic policy response snapshots

Enabled and disabled cosmetic policy results are immutable snapshots. Selector count and stylesheet semantics are unchanged.

## M693 — Lock hostile cosmetic runtime message rejection

Regression coverage locks accessor non-invocation, exact plain-message schemas, custom-prototype rejection, and revoked-proxy rejection at the cosmetic runtime message boundary.

## M694 — Lock cosmetic refresh disposal behavior

Regression coverage locks teardown semantics: disposal suppresses queued and future storage-driven refreshes, and public runtime operations reject after disposal.

## M695 — Make tab fanout message capture descriptor-safe

Fanout message capture no longer uses `structuredClone`. It builds a bounded descriptor-only snapshot from plain structured data, rejecting accessors, symbols, unsafe prototypes/proxies, cycles/repeated object references, non-finite numbers, and work beyond explicit depth/node/field/array/text ceilings. Accepted object/array snapshots are detached and frozen before the first send.

## M696 — Lock hostile tab target and sender collaborator handling

Regression coverage verifies hostile tab `id` accessors are not invoked, malformed/revoked target entries are skipped while valid neighbors survive, and accessor-based `tabs.sendMessage` collaborators are rejected without invocation.

## M697 — Add executable runtime fanout hardening audit

`tools/runtime-fanout-hardening-audit.mjs` enforces the M689–M696 source and regression boundaries and rejects a return to `structuredClone` message capture. `runtime-fanout-hardening-audit` is part of `npm run check`.

## M698 — Synchronize runtime fanout hardening state

Roadmap, release-gate guidance, and current-state audits are synchronized to this block. Issue #10 remains the authoritative real Chromium + Firefox runtime qualification gate.

## Evidence boundary

The code, tests, audits, and documentation in this block were created through the repository connector. They were not executed locally or in browsers in this continuation. They are repository preflight coverage only and do not constitute browser or release qualification.
