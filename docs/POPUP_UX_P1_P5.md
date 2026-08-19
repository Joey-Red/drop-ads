# Popup UX P1–P5 — Accessibility and failure-visibility polish

This independent popup-polish track uses `Popup UX P*` identifiers so it does not collide with the concurrently advancing core milestone sequence. It changes only popup presentation, status routing, and accessibility semantics. It does not change network/cosmetic policy, permissions, storage retention, telemetry, list fetching, or release qualification requirements.

## Popup UX P1 — Always-visible global status

The popup now owns a dedicated `#global-status` live region outside the HTTP(S)-only site section.

- initial/global state read failures remain visible even when site controls are unavailable
- live-sync registration failures and Settings-open failures use the global status channel
- global protection progress/failure uses the same channel
- site/session/picker feedback remains in the site-local status region
- revision-gated clearing prevents older async completion from erasing a newer message

Focused coverage: `tests/popup-ux-p1-global-status.test.js`.

## Popup UX P2 — Accessible mutation busy state

The popup main region exposes `aria-busy="false"` at rest and uses a reference-counted busy lease for user-triggered policy work.

- global protection, persistent site protection, session pause/resume, cookie exception, and picker start acquire a busy lease
- releases are idempotent and happen on success/failure paths
- overlapping operations cannot clear a newer operation's busy state
- passive storage rerenders and Settings navigation remain non-blocking

Focused coverage: `tests/popup-ux-p2-busy-state.test.js`.

## Popup UX P3 — Native semantic hierarchy and grouped site actions

The popup uses native structural semantics while retaining its compact layout and keyboard order.

- the popup title is an `h1`
- the current site is an `h2`
- Pause/Resume and Pick element are one labelled site-actions group
- global/site/cookie controls reference their existing live/help descriptions
- existing control IDs and tab order are unchanged

Focused coverage: `tests/popup-ux-p3-semantics.test.js`.

## Popup UX P4 — Unsupported-tab guidance

When the active tab is not a validated HTTP(S) page, the popup explains why site-specific controls are absent instead of presenting an unexplained gap.

- `Site controls are available on HTTP(S) pages.` is visible by default
- the note is non-live and does not compete with actionable status messages
- it hides only after the bounded active-tab snapshot and domain normalization succeed
- active-tab lookup/normalization failure keeps the generic note without exposing browser details
- global protection and Settings remain available

Focused coverage: `tests/popup-ux-p4-site-unavailable.test.js`.

## Popup UX P5 — Forced-colors readability

The popup retains readable secondary/status/help text and structural focus cues in forced-colors environments.

- system `CanvasText` is used for structural/button borders
- secondary/status/help text returns to full opacity
- focus-visible outlines use system `Highlight`
- normal system-color styling and reduced-motion handling remain unchanged
- no custom/neon accents or animation were added

Focused coverage: `tests/popup-ux-p5-forced-colors.test.js`.

## Validation and privacy state

Connector-created or connector-edited regression coverage in this track is repository coverage only and was **not executed as local/package/browser validation** in this workflow. No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, or real Chromium/Firefox qualification result is claimed here.

PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate. Any source commit after a real browser observation invalidates that observation for qualification.

This track introduces no telemetry, analytics, browsing/request history, matched-element history, statistics database, user/device identifiers, custom backend, new permissions, cookie-database access, or remote executable code.
