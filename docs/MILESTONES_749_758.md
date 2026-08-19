# Milestones 749–758 — Settings navigation and keyboard accessibility

This block continues human-facing accessibility/UX hardening without changing blocking precedence, permissions, data retention, or the release qualification model.

## M749 — Associate Settings controls with feedback regions

- Inputs/selects/buttons reference the status or error region that reports their operation through explicit `aria-describedby` relationships.
- Existing native labels and live-region roles remain intact.

## M750 — Disable unwanted text correction in policy inputs

- Domain, URL, TLD, and CSS-selector text entry disables autocapitalization/autocorrection in addition to existing autocomplete/spellcheck suppression.

## M751 — Add compact Settings section navigation

- Added a labelled in-page navigation near the page heading.
- Every major Settings area has a stable section id and jump link.

## M752 — Make Settings jump navigation keyboard-visible and reflow-safe

- Jump links are 44px minimum keyboard targets, wrap cleanly, expose visible focus, and preserve section scroll margin.
- Increased-contrast and forced-colors modes preserve link boundaries and focus.

## M753 — Restore keyboard focus after country-mode changes

- Country mode controls carry canonical TLD identity.
- Successful rerenders restore focus to the replacement select without interpolating policy text into selector strings.

## M754 — Disambiguate cosmetic-rule removal controls

- Cosmetic remove-button accessible names include canonical site scope, distinguishing identical selectors across scopes while visible button text remains compact.

## M755 — Restore country-mode focus after failed changes

- Failed transactional country-mode changes rerender committed state and restore focus to the replacement control or safe preset fallback.
- Dynamic country-mode controls reference the country status region.

## M756 — Honor increased-contrast preference in the popup

- Popup status/help/disabled cues become fully opaque and major boundaries use current text color under `prefers-contrast: more`.

## M757 — Make popup reduced-motion handling future-proof

- Popup reduced-motion mode suppresses future animation/transition motion and smooth scrolling.
- No animation was introduced.

## M758 — Extend the executable UI accessibility gate

- Extended `tools/settings-accessibility-audit.mjs` through M757.
- The audit now requires the new M749–M757 regressions and verifies feedback relationships, section navigation, keyboard recovery, scoped cosmetic labels, and popup preference parity.
- Existing `settings-accessibility-audit` package/check wiring remains the canonical executable gate.

## Validation status

All source changes, tests, audits, and documentation in this block were authored through the GitHub connector. They were not executed locally or in Chromium/Firefox during this work. Issue #10 remains the authoritative exact-head real-browser qualification gate.

No telemetry, analytics, request/browsing history, page/DOM history, retained statistics, identifiers, polling, or owned Drop Ads backend behavior was added.
