# Milestones 809–818 — Popup semantics and lifecycle hardening

This block reconciles popup work landed during overlapping continuation turns into the canonical ROADMAP sequence. `ROADMAP.md` remains the sole milestone-number authority. Connector-created tests and audits described here were not executed locally or in browsers; Issue #10 remains the real-browser release gate.

## M809 — Inactive site-state explanations

The popup derives idle explanations for persistent site disable, session-only pause, global blocking off, and local cookie exceptions from current rendered state. Explicit transaction/error feedback retains precedence, and no browsing history or identifiers are retained.

## M810 — Visible site context for actions

Site-specific popup actions are grouped under the visible current-site identity and retain their live status/help relationships.

## M811 — Master-switch guidance

The global Blocking switch references visible guidance explaining that turning blocking off does not delete local rules or exceptions.

## M812 — Explicit local-only privacy cue

The popup exposes `Local only · no telemetry`; the main landmark and global controls reference this visible cue without introducing measurement.

## M813 — Owned async page lifecycle

The primary popup installs lifecycle ownership before top-level async initialization. `pagehide` invalidates queued/in-flight committed renders and disposes live synchronization.

## M814 — Teardown-safe render queues

Storage-driven render admission, queued execution, and async committed-state publication all reject work after teardown.

## M815 — Teardown-safe status publication

Global/site status writes and revisions are lifecycle-bound so stale async completions cannot publish after teardown.

## M816 — Teardown-safe busy/finalizer work

Busy admission/release and async control finalizers are lifecycle-aware; detached popup controls are not rewritten after `pagehide`.

## M817 — Executable popup semantics/lifecycle gates

`tools/popup-semantics-audit.mjs` enforces the canonical popup semantics/privacy contract and the current lifecycle ownership surface. Site-scoped mutations publish independent `aria-busy` state on the visible site section while retaining the popup-wide busy contract. `tools/popup-lifecycle-audit.mjs` independently locks the M813–M816 teardown/render/status/busy boundary. Both preflight gates are wired into `npm run check`; focused regressions prevent either gate from silently disappearing.

## M818 — State synchronization

ROADMAP, qualification documentation, executable preflight state, and Issue #10 are synchronized around this popup boundary. Exact-head real Chromium and Firefox observations remain mandatory and are not replaced by repository audits.

## Privacy boundary

These milestones add no telemetry, analytics, browsing/request history, retained statistics, page/DOM history, identifiers, cookie database access, or owned Drop Ads backend. Presentation helpers derive only current local popup state and own their teardown.
