# Milestones 385–389 — Picker input and UI containment

This block hardens the shipped closed-shadow element picker without changing policy scope, permissions, retention, or the two-minute session lifetime. Connector-created/edited regression coverage in this block is repository coverage only and was **not executed locally or in a browser here**.

## Milestone 385 — Contained runtime-start messaging

`drop-ads:start-element-picker` still passes through the exact content-message contract, but picker startup failure no longer escapes the WebExtension runtime listener. Startup success/failure is returned through a best-effort `sendResponse` helper, startup error text is bounded by the existing content caught-error formatter with a reviewed local fallback, and response callback failure is contained.

Repository coverage: `tests/content-picker-start-message-v385.test.js`.

## Milestone 386 — Highlight style write containment

The already-bounded finite picker geometry path no longer writes directly through `box.style`. Highlight display/position/size changes use a best-effort style-property writer that contains style lookup and assignment failures. Invalid geometry continues to hide the highlight best effort, and a failed highlight write cannot escape mouse, focus, scroll, or resize handling.

Repository coverage: `tests/content-picker-highlight-style-v386.test.js`.

## Milestone 387 — Atomic preview publication

Generated selectors remain provisional until all required preview UI work succeeds. Candidate text, candidate visibility, action visibility, status text, and Save focus now run through contained helpers. Any failed publication step rejects the preview before `candidate`/`selecting` state commits, then best-effort clears candidate UI, hides actions, restores a bounded failure status, and leaves element selection retryable.

Repository coverage: `tests/content-picker-preview-transaction-v387.test.js`.

## Milestone 388 — Duplicate save suppression

Button disabled state remains a visual/accessibility aid rather than a correctness dependency. Every picker session now carries an internal `saving` guard; repeat activation while a cosmetic mutation is in flight is ignored even if disabled-state mutation fails or a synthetic/reentrant click is delivered. The guard is set before awaited work, reset before recoverable failure UI restoration, and cleared by session cleanup/success.

Repository coverage: `tests/content-picker-save-guard-v388.test.js`.

## Milestone 389 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized to this block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate. No `npm ci`, repository check/package/reproducibility/source-qualification command, or real-browser observation is claimed as executed by these connector changes.

## Privacy and product invariants preserved

- no telemetry, analytics, browsing/request history, retained matched-element history, identifiers, or custom Drop Ads backend
- no new permissions
- no page/DOM snapshots or retained picker history
- cosmetic save remains explicit, local, and site-scoped
- existing selector/message/response boundaries and two-minute picker lifetime remain in force
