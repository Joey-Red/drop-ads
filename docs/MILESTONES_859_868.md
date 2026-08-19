# Milestones 859–868 — Popup keyboard discoverability and shortcut hardening

This canonical block hardens popup keyboard access without creating a second policy path. `ROADMAP.md` remains the sole canonical milestone-number authority; overlap-era issue labels and regression filenames are supporting history only.

## M859 — Keep unavailable shortcuts discoverable

- Shortcut help rows stay visible even when their native command is unavailable.
- Availability is expressed separately from discoverability, so users can learn the complete keyboard surface on any popup state.
- Unavailable commands still fail closed before consuming the key or entering any policy path.

## M860 — Align shortcut availability with busy state

- `src/popup/shortcut-availability.js` is the shared actionability boundary.
- An action requires an active popup plus a connected, enabled, visible target outside hidden/busy ancestors while neither the popup nor exact control is busy.
- Availability uses only current popup state and retains no keyboard, browsing, or activity history.

## M861 — Publish availability for every shortcut row

- Every reviewed G/S/C/P/E/O help row maps to its exact native control and publishes current unavailable state.
- The reviewed frozen shortcut-definition table prevents help-row metadata from silently targeting another control.

## M862 — Give unavailable shortcuts a generic visible cue

- Unavailable rows expose `aria-disabled` and a visible `Unavailable` marker.
- The marker is generic and never includes the current site, URL, or browsing context.

## M863 — Keep unavailable presentation resilient

- Shortcut rows and markers remain compact and readable at narrow popup widths.
- Increased-contrast and forced-colors modes remove low-opacity ambiguity while preserving the matte system-color design.

## M864 — Summarize current shortcut availability generically

- Shortcut help states whether all commands are available or whether unavailable commands are marked.
- Guidance explains that site commands require HTTP(S) context and busy controls temporarily reject commands without echoing site identity.

## M865 — Strengthen shortcut-help relationships

- The native `details` disclosure is labelled by its visible summary.
- Summary and shortcut list both reference the same visible availability guidance, while the summary retains the `?` discovery shortcut and list relationship.

## M866 — Centralize shortcut actionability ownership

- `popup-keyboard.js` plus `shortcut-availability.js` exclusively decide actionability and publish `aria-disabled` on help rows.
- `popup-semantics.js` only presents that authoritative `aria-disabled` state as visible markers/help text; it does not recompute control actionability.
- A list-scoped observer owns presentation updates and disconnects on popup teardown.
- Overlap-era M859–M866 regressions were reconciled to this final authority split.

## M867 — Harden disclosure lifecycle metadata

- The shortcut summary publishes `?` while closed and `? Escape` while open.
- Both keyboard-driven and native mouse/touch disclosure changes synchronize metadata and current availability.
- The native `toggle` listener and keyboard listener are removed on `pagehide`, and Escape returns focus to the visible summary.

## M868 — Enforce and synchronize the block

- `popup-keyboard-audit`, `popup-keyboard-hardening-audit`, and `popup-interaction-audit` enforce the final reviewed routing, actionability, discoverability, presentation, disclosure lifecycle, privacy, and teardown boundaries.
- `npm run check` already includes the popup keyboard gates; this continuation reconciles their assertions and regressions with the final M859–M867 architecture.
- `ROADMAP.md` advances the next canonical milestone to M869 and Issue #10 remains open for exact-head real Chromium + Firefox qualification.

## Evidence boundary

M859–M868 repository changes were **not executed locally or in browsers** in this continuation. Connector-created or reconciled tests, audits, source, and documentation are repository preflight coverage only. This block records no Chromium/Firefox runtime observation and makes no release-qualification claim.

The privacy boundary is unchanged: no telemetry, analytics, keyboard/activity history, browsing/request history, page/DOM snapshots, retained statistics, identifiers, or owned Drop Ads backend behavior.
