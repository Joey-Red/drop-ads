# Milestones 369–373 — Picker lifecycle resilience

This block closes several picker lifecycle failure modes without expanding retention, permissions, or data collection. All regression files added here are repository coverage only; no local test run or browser qualification is claimed.

## Milestone 369 — Picker timer collaborator failure containment

`createPickerSessionTimer()` now detaches its retained handle before best-effort cancellation. A throwing cancellation collaborator cannot abort `cancel()` or rearm cleanup. Scheduling failure leaves no retained handle and invalidates the attempted generation. Synchronous timeout delivery cannot be overwritten by a stale returned handle, stale callbacks cannot expire a rearmed session, and an expiry callback failure cannot resurrect timer state. The production maximum remains 120,000 ms.

Coverage: `tests/content-picker-timer-failure-v369.test.js`.

## Milestone 370 — Active-session publication before lifetime arm

`startPicker()` now publishes the `{sessionId, cleanup}` record before arming the lifetime. A synchronously delivered expiry can therefore clear the exact active session and is not overwritten when `arm()` returns. If arming throws, picker cleanup is invoked before the failure propagates.

Coverage: `tests/content-picker-session-publication-v370.test.js`.

## Milestone 371 — Teardown state release and best-effort DOM cleanup

Picker cleanup now marks the session cleaned, clears its own active record, and releases the selected target/candidate before external teardown. Document/window listener removal and host removal are trap-contained best-effort operations, so one collaborator failure cannot prevent remaining cleanup. Existing session identity protection and idempotence remain intact.

Coverage: `tests/content-picker-teardown-v371.test.js`.

## Milestone 372 — Preview rollback and selection recovery

Generated selectors remain provisional until preview positioning, content display, action visibility, status text, and focus all complete. Only then does the picker commit the candidate and disable selection. Preview failure releases the provisional candidate, restores selection, best-effort hides/resets preview UI, and contains error-display failure so the event path remains usable.

Coverage: `tests/content-picker-preview-rollback-v372.test.js`.

## Milestone 373 — Documentation and exact-head release-gate synchronization

This milestone records the block in `ROADMAP.md`, synchronizes draft PR #7, and records the resulting exact branch head on Issue #10. PR #7 remains draft and Issue #10 remains the authoritative clean-preflight plus real Chromium/Firefox qualification gate.

## Privacy and release invariants

- no telemetry, analytics, browsing/request history, matched-element history, identifiers, or custom backend
- no permission expansion
- no page/DOM snapshot persistence or longer picker retention
- production picker lifetime remains at most 2 minutes
- connector-created regression coverage is not represented as executed validation
- any source commit after real browser observation invalidates that observation for qualification
