# Milestones 380–384 — Picker startup, accessibility, and stale-session recovery

This block hardens the shipped closed-shadow element picker without changing its privacy model, permissions, local-only save semantics, two-minute lifetime, or matte black/white interaction design. Connector-created/edited regression coverage in this block is repository coverage only and was **not executed here**.

## Milestone 380 — Transactional picker startup

Picker startup now treats host construction, required document/window listener registration, active-session publication, and lifetime arming as one rollback-aware sequence. Every successful global listener installation is recorded and cleanup removes the exact recorded set in reverse order. Listener lookup/call failure aborts startup, and a partially-created/appended host is removed even when failure happens before active-session publication.

The earlier M371 teardown regression was aligned with the listener registry so it still proves internal session/target/candidate state is released before external cleanup.

Coverage: `tests/content-picker-startup-transaction-v380.test.js` plus the aligned `tests/content-picker-teardown-v371.test.js`.

## Milestone 381 — Screen-reader discoverable picker status

The picker dialog now uses its visible title through `aria-labelledby` and associates its instructions/status paragraph through `aria-describedby`. That status paragraph is a polite atomic live region, allowing preview, saving, and failure changes to be announced without stealing focus or turning the page-selection workflow into a modal trap.

Coverage: `tests/content-picker-accessibility-v381.test.js`.

## Milestone 382 — Save recovery UI containment

Picker save-start status/disabled-state writes now run inside the contained async save operation. Minimal best-effort helpers isolate status-text and boolean-disabled writes. If the caught-error formatter itself throws or returns a non-string, the reviewed local fallback remains authoritative. Failure recovery attempts the status update and both control re-enables independently so one UI collaborator failure cannot escape the event path or block the remaining recovery work.

Coverage: `tests/content-picker-save-recovery-v382.test.js`.

## Milestone 383 — Recovery after external host removal

The active session record now retains the already-live picker host identity only for the life of that picker session. Repeated start requests verify host connectivity through a trap-contained boolean check. A connected host still suppresses duplicate sessions. A disconnected/trapped host is treated as stale: the stale active identity is cleared first, its cleanup is attempted best effort, and a replacement picker may start immediately instead of being blocked until the two-minute timeout.

The M370 active-publication regression and M380 startup-transaction regression were aligned with the active record's host field while preserving publication-before-arm ordering and session-id cleanup protection.

Coverage: `tests/content-picker-stale-host-v383.test.js` plus aligned `tests/content-picker-session-publication-v370.test.js` and `tests/content-picker-startup-transaction-v380.test.js`.

## Milestone 384 — Documentation and exact-head gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. No connector-created/edited regression in M380–383 is represented as executed local/package/browser validation, and no product-readiness claim is made.

Privacy invariants remain unchanged: no telemetry, analytics, browsing/request history, retained matched-element/page-content history, identifiers, custom backend, or new permissions were introduced.
