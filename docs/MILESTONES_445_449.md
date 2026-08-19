# Milestones 445–449 — Post-M444 regression and metadata reconciliation

This block aligns focused regression/accessibility coverage and reconciles concurrent continuation metadata without changing Drop Ads' browser-local privacy model, reviewed permissions, policy precedence, or retention behavior. Connector-created or connector-edited coverage described here is repository coverage only and was **not executed** as local/package/browser qualification in this workflow.

## Milestone 445 — Timeout-controller regression alignment

Focused coverage locks the existing M440 timeout-controller boundary: cleanup failure cannot replace a successful task outcome, and malformed/accessor-shaped injected controller state fails before timer/source work. The established **30,000 ms default / 120,000 ms maximum** timeout contract and captured native/synthetic AbortController behavior remain unchanged.

## Milestone 446 — Popup site-region accessibility

Site-specific popup controls expose explicit semantic context: the site section is labelled by the visible site heading, described by its help text, uses a level-2 heading, and keeps session/global status regions polite and atomic. Controls remain hidden until a validated HTTP(S) tab is available, and keyboard behavior is unchanged.

## Milestone 447 — Bootstrap intrinsic collaborator regression alignment

Regression coverage locks intrinsic-safe optional-feature bookkeeping and callback capture, including prototype-looking feature names, intrinsic Map storage rather than caller-poisonable `set`, retained disposer identity, and the raw **64-character** optional feature-name bound. Existing reverse-order teardown and optional-feature failure isolation remain unchanged.

## Milestone 448 — Concurrent tracker reconciliation

Duplicate/conflicting milestone trackers created by simultaneous continuation attempts are closed or superseded in favor of the canonical ROADMAP chronology. This is repository hygiene only; closing a tracker does not constitute implementation validation or qualification.

Additional already-landed boundaries encountered during reconciliation—such as post-disposal runtime task rejection and bounded import-preflight response handling—remain preserved in source and focused repository coverage without being used to rewrite this canonical milestone numbering.

## Milestone 449 — Exact-head metadata synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized to the canonical continuation state. PR #7 remains draft and Issue #10 remains open for a clean exact-head machine preflight and real Chromium + Firefox qualification. Connector-only work is not represented as `npm ci`, test execution, package/release verification, reproducibility verification, source qualification, qualification-record generation, or browser qualification.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained request or matched-element history, page/DOM capture, identifiers, cookie-database access, a custom Drop Ads backend, remote executable code, or new permissions.
