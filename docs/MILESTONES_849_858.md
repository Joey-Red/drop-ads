# Milestones 849–858 — Settings session recovery and configured reset hardening

This block makes temporary session recovery and configured reset first-class, bounded, keyboard-safe Settings operations. `ROADMAP.md` remains the sole canonical milestone-number authority; overlapping issue labels and historical test filenames created by concurrent continuation work are supporting history only and do not reallocate these milestones.

## M849 — Canonical temporary-session recovery surface

Settings owns one idempotent Temporary session pauses recovery surface and one explicit recovery bootstrap. The navigation target and section are reused rather than duplicated, initialization requires the complete local control surface, and the state source remains canonical browser session storage only.

## M850 — Deterministic per-site and bulk recovery

Each paused site exposes a typed `drop-ads:set-session-site-paused` recovery action with `paused:false`, while `Resume all` walks a fixed-code-unit ordered session snapshot. Recovery feedback is generic and statistics-free, and failed domains remain retryable rather than being silently discarded.

## M851 — Keyboard-safe recovery focus

Successful per-site recovery restores focus to the nearest remaining Resume protection action and moves focus to the visible section heading when the final row disappears. Bulk recovery restores a useful control only after busy cleanup, including partial-failure recovery.

## M852 — Session-scoped live synchronization

The recovery surface listens only for the canonical session-storage key in the `session` storage area, suppresses its own internal mutations, coalesces external refresh work, and rejects stale render generations. The listener and queued work are page-lifecycle owned.

## M853 — Configured-reset scope and session preservation

Configured reset is a separate persistent-settings recovery operation. Its canonical reset state covers configured network/cosmetic rules, subscriptions, persistent exceptions, cookie preferences, and related settings while intentionally leaving temporary browser-session pauses untouched.

## M854 — Dedicated reset runtime boundary

Reset requests and responses use the reviewed Settings runtime boundary instead of a generic message/result shape. The reset operation captures its transactional collaborator without invoking hostile accessors and preserves the original receiver when invoking the reviewed import path.

## M855 — Inline confirmation and busy ownership

Reset uses an explicit in-page confirmation group instead of blocking native confirmation. Only the confirm action can start the mutation; Cancel and Escape are no-op recovery paths that restore focus, and busy ownership prevents cancellation or duplicate reset work during the active transaction.

## M856 — Privacy-minimal transactional reset

Configured reset constructs normalized persistent defaults, serializes them through the strict settings-backup format, and delegates activation to the existing transactional settings-import path. Error/status output remains bounded and generic, and no reset history, browsing/request history, statistics, identifiers, or session state is retained.

## M857 — Canonical executable recovery gates

`settings-session-recovery-audit`, `settings-reset-audit`, and `settings-recovery-controls-audit` enforce the canonical recovery/reset boundaries and their focused regressions. The gates cover idempotent session recovery, typed mutations, deterministic focus/order, live-sync and teardown, reset/session separation, descriptor-safe transactional delegation, inline confirmation, keyboard cancellation, and busy ownership; they are part of `npm run check`.

## M858 — Synchronize canonical state

The milestone record, ROADMAP, qualification state/runbook guidance, executable state audit, and Issue #10 are synchronized with M859 declared next. Repository tests/audits remain preflight evidence only; exact-head real Chromium and Firefox observations are still required before release qualification.

## Evidence boundary

All work in this block was performed or reconciled through the GitHub connector. Connector-created or connector-updated tests and audits were **not executed locally or in browsers here**. No Chromium/Firefox runtime observation or release qualification is claimed. Issue #10 remains the authoritative exact-head real-browser gate.

The permanent privacy boundary is unchanged: no telemetry, analytics, browsing/request history, page/DOM snapshots, retained statistics, identifiers, or owned Drop Ads backend behavior.
