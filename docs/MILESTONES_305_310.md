# Milestones 305–310 — UI caught-exception and refresh containment

This block hardens exception text and direct UI refresh failures without changing blocker semantics, permissions, privacy posture, or the release gate.

## Milestone 305 — Bound popup caught exception text

The popup now routes caught browser/local exceptions through `popupCaughtErrorMessage()` before any message can reach popup status text. The helper keeps the existing 1,024-character popup error ceiling, requires a reviewed non-empty bounded fallback, and only accepts an own data `message` string. Missing, empty, oversized, type-confused, accessor-backed, or descriptor-trapping values fall back without executing a message getter. Popup render/mutation/picker catch paths no longer dereference `error.message` directly.

## Milestone 306 — Bound Settings caught exception text

`optionsCaughtErrorMessage()` provides the corresponding shared Settings boundary for direct browser/local exceptions that do not arrive through the already-strict runtime response envelopes. It uses the same 1,024-character Settings error ceiling and own-data message rule while preserving all existing response schemas, outcome exclusivity, deep result bounds, subscription validation, and personal-rule validation.

## Milestone 307 — Contain action-count Settings API failures

The Protection action count section now uses the bounded Settings caught-error helper. A rejected initial preference load no longer aborts the Settings module; the control retains the reviewed enabled visual fallback and surfaces bounded status text when the browser supports the badge API. A failed preference mutation restores the latest stored preference when readable, otherwise restores the pre-click visual state while preserving the original bounded failure. The feature still uses only the browser-owned aggregate and does not observe or retain individual requests.

## Milestone 308 — Contain Country Settings refresh failures

Country / region Settings initial rendering and storage-triggered rerenders are now contained. Add/remove/mode failures use the bounded helper, and best-effort rerender after a failed mutation cannot mask the original action failure. Conversely, a successful committed mutation followed by a render failure is reported as a refresh problem rather than being described as a rolled-back mutation. Country policy semantics, local-only/community restrictions, and focus behavior on successful refresh remain unchanged.

## Milestone 309 — Contain Cosmetic Settings refresh failures

Cosmetic Settings applies the same containment model. Initial and storage-triggered renders no longer leak rejected promises, add/remove caught errors are bounded, and failed best-effort rerender does not replace the original mutation error. When a cosmetic mutation succeeds but the follow-up render fails, the UI reports that refresh failure without implying the committed rule was reverted. Internal mutation suppression, render coalescing, busy state, and focus behavior remain intact.

## Milestone 310 — Documentation and exact-head gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate, and PR #7 remains draft.

## Validation status

The regression files added in Milestones 305–309 are **repository coverage only**. They were added through the GitHub connector and were not executed locally or in Chromium/Firefox in this work session. No `npm ci`, `npm run check`, packaging, reproducibility, source qualification, or browser qualification result is claimed here.

## Privacy invariants

This block adds no telemetry, analytics, browsing history, request history, matched-element history, identifiers, custom backend, new permission, or retained statistics. All caught-error handling remains local to extension UI execution.
