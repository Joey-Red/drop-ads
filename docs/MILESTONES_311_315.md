# Milestones 311–315 — Main Settings resilience

This block hardens the primary Settings surface against collaborator and local browser failures without changing blocking semantics, permissions, privacy posture, or the exact-head release gate.

## 311 — Contain main Settings caught exceptions

`src/options/options.js` now routes user-visible caught exceptions through the shared `optionsCaughtErrorMessage()` boundary. The helper admits only an own-data, non-empty string at or below the reviewed **1,024-character** Settings error ceiling; accessors, descriptor traps, oversized strings, and type-confused values fall back to reviewed local text.

The initial `render()` is also contained so a failed storage read does not prevent later Settings event wiring. Storage-change rerenders remain coalesced and their failures are similarly bounded.

## 312 — Preserve cookie-mode failure identity during recovery

Settings retains the last committed cookie-mode value. If a cookie-mode mutation fails, the bounded primary mutation error is captured before recovery is attempted. A best-effort committed-state reload may restore the selector; if that reload also fails, Settings restores the pre-change committed visual value. The secondary recovery failure never masks the original mutation failure.

## 313 — Separate committed personal/site mutations from view refresh failures

A shared `refreshCommittedView()` helper now contains follow-up UI refresh failures after successful policy mutations. Personal rule add/remove, allow-override removal, cookie exceptions, and site-domain recovery paths therefore distinguish two outcomes:

- policy mutation failed — show the existing bounded action-specific failure;
- policy mutation committed, but Settings could not refresh its local view — keep the committed state and show an explicit bounded view-refresh warning.

Focus movement that depends on newly rendered controls occurs only after a successful view refresh. Optional GitHub community preparation remains independent from local rule activation and remains OFF by default unless the user explicitly opts in.

## 314 — Separate committed subscription/import changes from view refresh failures

Subscription add/enable/disable/remove paths now use the same post-commit refresh containment. A successful enable/disable is not visually reverted merely because `refreshSubscriptions()` later fails. Subscription source notes and transaction results remain authoritative.

Settings import likewise remains reported as imported and activated if the subsequent full Settings render fails. The user receives a separate view-refresh warning while the existing import fetch summary is preserved.

## 315 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. Connector-added regression files are repository coverage only: no `npm ci`, test suite, package/release verification, reproducibility run, source qualification, generated qualification record, or real Chromium/Firefox behavior is claimed as executed here.

PR #7 must remain draft and Issue #10 must remain open until clean exact-head preflight and the real cross-browser matrix are completed against the same generated package hashes.

## Privacy invariants preserved

Milestones 311–315 add no telemetry, analytics, browsing/request history, retained matched-request statistics, page/DOM history, identifiers, cookie database access, custom Drop Ads backend, new permissions, or remote executable-code path.
